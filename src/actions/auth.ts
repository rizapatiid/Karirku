'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const secretKey = process.env.NEXTAUTH_SECRET || 'supersecret_for_development'
const key = new TextEncoder().encode(secretKey)

export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  let dest = '/kasir'

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true }
    })

    if (!user) return { error: 'Username atau password salah' }
    if (user.status !== 'ACTIVE') return { error: 'Akun Anda tidak aktif' }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) return { error: 'Username atau password salah' }

    const expires = new Date(Date.now() + 10 * 60 * 60 * 1000)
    const session = await new SignJWT({ 
      userId: user.id, 
      username: user.username,
      name: user.name,
      role: user.role.name 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10h')
      .sign(key)

    const cookieStore = await cookies()
    cookieStore.set('session', session, { expires, httpOnly: true, path: '/' })

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        description: `User ${user.username} berhasil login`
      }
    })

    dest = user.role.name === 'OWNER' ? '/owner' : (user.role.name === 'ADMIN' ? '/admin' : '/kasir')

  } catch (error) {
    console.error(error)
    return { error: 'Terjadi kesalahan sistem' }
  }

  redirect(dest)
}

export async function validateCashierEmployee(employeeIdOrUsername: string) {
  try {
    const trimmed = employeeIdOrUsername.trim()
    if (!trimmed) {
      return { success: false, error: 'Masukkan ID atau Username Karyawan' }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { username: trimmed },
          { name: { equals: trimmed } }
        ],
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: { select: { name: true } }
      }
    })

    if (!user) {
      return { success: false, error: `ID / Username '${trimmed}' tidak ditemukan atau tidak aktif di database!` }
    }

    return { 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role.name
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal memvalidasi ID Karyawan' }
  }
}

export async function getRegisteredCashiers() {
  try {
    const cashiers = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' }
    })
    return cashiers
  } catch (error) {
    return []
  }
}

export async function loginKasirWithSelfie({
  employeeIdOrUsername,
  selfieData
}: {
  employeeIdOrUsername: string
  selfieData?: string
}) {
  let dest = '/kasir'

  try {
    const trimmed = employeeIdOrUsername.trim()
    if (!trimmed) {
      return { error: 'Masukkan ID atau Username Karyawan Kasir' }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { username: trimmed },
          { name: { equals: trimmed } }
        ],
        status: 'ACTIVE'
      },
      include: { role: true }
    })

    if (!user) {
      return { error: `ID / Username Karyawan '${trimmed}' tidak ditemukan atau tidak aktif di database!` }
    }

    const expires = new Date(Date.now() + 10 * 60 * 60 * 1000)
    const session = await new SignJWT({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10h')
      .sign(key)

    const cookieStore = await cookies()
    cookieStore.set('session', session, { expires, httpOnly: true, path: '/' })
    if (selfieData) {
      cookieStore.set('kasir_selfie', selfieData, { expires, httpOnly: true, path: '/' })
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        description: `Kasir ${user.name} (@${user.username}) berhasil login absensi selfie`
      }
    })
  } catch (error: any) {
    console.error(error)
    return { error: error.message || 'Terjadi kesalahan sistem saat login kasir' }
  }

  redirect(dest)
}

export async function logout() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  
  if (token) {
    try {
      const parsed = await jwtVerify(token, key)
      const userId = parsed.payload.userId as string
      
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'LOGOUT',
          module: 'AUTH',
          description: `User berhasil logout`
        }
      })
    } catch (e) {
      // ignore invalid token on logout
    }
  }

  cookieStore.delete('session')
  cookieStore.delete('kasir_selfie')
  redirect('/login')
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  try {
    const { payload } = await jwtVerify(session, key)
    const selfie = cookieStore.get('kasir_selfie')?.value || null
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      name: payload.name as string,
      role: payload.role as string,
      selfie
    }
  } catch (error) {
    return null
  }
}



