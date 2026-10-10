'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from './auth'

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const roleId = formData.get('roleId') as string

  const res = await saveUser({ name, username, password, roleId })
  if (res.success) {
    redirect('/users')
  } else {
    return { error: res.error }
  }
}

export async function getUsers() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'OWNER' && session.role !== 'ADMIN' && session.role !== 'Owner' && session.role !== 'Admin')) {
      throw new Error('Akses ditolak: Hanya Owner dan Admin yang dapat mengelola pengguna.')
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { role: true }
    })

    return { success: true, users: JSON.parse(JSON.stringify(users)) }
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return { success: false, error: error.message || 'Gagal mengambil data pengguna', users: [] }
  }
}

export async function getRoles() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' }
    })
    return { success: true, roles: JSON.parse(JSON.stringify(roles)) }
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    return { success: false, error: error.message || 'Gagal mengambil data role', roles: [] }
  }
}

export async function saveUser({
  id,
  name,
  username,
  password,
  roleId,
  phone,
  email,
  status = 'ACTIVE'
}: {
  id?: string
  name: string
  username: string
  password?: string
  roleId: string
  phone?: string
  email?: string
  status?: 'ACTIVE' | 'INACTIVE'
}) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'OWNER' && session.role !== 'ADMIN' && session.role !== 'Owner' && session.role !== 'Admin')) {
      return { success: false, error: 'Akses ditolak: Hanya Owner dan Admin yang memiliki wewenang.' }
    }

    const trimmedUsername = username.trim()
    const trimmedName = name.trim()

    if (!trimmedName || !trimmedUsername || !roleId) {
      return { success: false, error: 'Nama, Username, dan Role/Jabatan wajib diisi!' }
    }

    if (id) {
      // EDIT MODE
      const existingUser = await prisma.user.findUnique({ where: { id } })
      if (!existingUser) {
        return { success: false, error: 'Pengguna tidak ditemukan' }
      }

      // Check unique username if changed
      if (trimmedUsername.toLowerCase() !== existingUser.username.toLowerCase()) {
        const usernameCheck = await prisma.user.findUnique({ where: { username: trimmedUsername } })
        if (usernameCheck) {
          return { success: false, error: `Username '${trimmedUsername}' sudah digunakan oleh pengguna lain!` }
        }
      }

      const updateData: any = {
        name: trimmedName,
        username: trimmedUsername,
        roleId,
        phone: phone || null,
        email: email || null,
        status
      }

      if (password && password.trim() !== '') {
        updateData.passwordHash = await bcrypt.hash(password.trim(), 10)
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        include: { role: true }
      })

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'UPDATE',
          module: 'USER',
          referenceId: updatedUser.id,
          description: `Memperbarui data pengguna/karyawan: ${updatedUser.name} (@${updatedUser.username})`
        }
      })

      revalidatePath('/users')
      revalidatePath('/attendance')
      revalidatePath('/kasir')
      return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) }
    } else {
      // CREATE MODE
      if (!password || password.trim() === '') {
        return { success: false, error: 'Password wajib diisi untuk pengguna baru!' }
      }

      const usernameCheck = await prisma.user.findUnique({ where: { username: trimmedUsername } })
      if (usernameCheck) {
        return { success: false, error: `Username '${trimmedUsername}' sudah terdaftar dalam sistem!` }
      }

      const passwordHash = await bcrypt.hash(password.trim(), 10)

      const store = await prisma.store.findFirst()

      const newUser = await prisma.user.create({
        data: {
          name: trimmedName,
          username: trimmedUsername,
          passwordHash,
          roleId,
          storeId: store?.id || null,
          phone: phone || null,
          email: email || null,
          status
        },
        include: { role: true }
      })

      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: 'CREATE',
          module: 'USER',
          referenceId: newUser.id,
          description: `Mendaftarkan pengguna/karyawan baru: ${newUser.name} (@${newUser.username})`
        }
      })

      revalidatePath('/users')
      revalidatePath('/attendance')
      revalidatePath('/kasir')
      return { success: true, user: JSON.parse(JSON.stringify(newUser)) }
    }
  } catch (error: any) {
    console.error('Error saving user:', error)
    return { success: false, error: error.message || 'Gagal menyimpan data pengguna' }
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'OWNER' && session.role !== 'ADMIN' && session.role !== 'Owner' && session.role !== 'Admin')) {
      return { success: false, error: 'Akses ditolak!' }
    }

    if (session.userId === id) {
      return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login!' }
    }

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) {
      return { success: false, error: 'Pengguna tidak ditemukan' }
    }

    await prisma.user.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DELETE',
        module: 'USER',
        referenceId: id,
        description: `Menghapus akun pengguna/karyawan: ${target.name} (@${target.username})`
      }
    })

    revalidatePath('/users')
    revalidatePath('/attendance')
    revalidatePath('/kasir')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return { success: false, error: error.message || 'Gagal menghapus pengguna' }
  }
}

export async function toggleUserStatus(id: string) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'OWNER' && session.role !== 'ADMIN' && session.role !== 'Owner' && session.role !== 'Admin')) {
      return { success: false, error: 'Akses ditolak!' }
    }

    if (session.userId === id) {
      return { success: false, error: 'Anda tidak dapat menonaktifkan akun Anda sendiri!' }
    }

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) {
      return { success: false, error: 'Pengguna tidak ditemukan' }
    }

    const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    const updated = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
      include: { role: true }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE',
        module: 'USER',
        referenceId: id,
        description: `Mengubah status akun ${target.name} menjadi ${newStatus}`
      }
    })

    revalidatePath('/users')
    revalidatePath('/attendance')
    revalidatePath('/kasir')
    return { success: true, status: newStatus, user: JSON.parse(JSON.stringify(updated)) }
  } catch (error: any) {
    console.error('Error toggling user status:', error)
    return { success: false, error: error.message || 'Gagal mengubah status pengguna' }
  }
}
