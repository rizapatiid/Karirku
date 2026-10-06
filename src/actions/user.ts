'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from './auth'

export async function createUser(formData: FormData) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'Owner' && session.role !== 'Admin') {
      throw new Error('Unauthorized')
    }

    const name = formData.get('name') as string
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const roleId = formData.get('roleId') as string

    // Check existing
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return { error: 'Username sudah digunakan' }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        roleId,
        status: 'ACTIVE'
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE',
        module: 'USER',
        referenceId: user.id,
        description: `Mendaftarkan pengguna baru: ${username}`
      }
    })
  } catch (error: any) {
    console.error(error)
    return { error: error.message || 'Gagal menyimpan pengguna' }
  }

  revalidatePath('/users')
  redirect('/users')
}
