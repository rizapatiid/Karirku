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

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true }
    })

    if (!user) {
      return { error: 'Username atau password salah' }
    }

    if (user.status !== 'ACTIVE') {
      return { error: 'Akun Anda tidak aktif' }
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return { error: 'Username atau password salah' }
    }

    // Buat JWT Token
    const expires = new Date(Date.now() + 10 * 60 * 60 * 1000) // 10 jam
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

    // Simpan ke HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('session', session, { expires, httpOnly: true, path: '/' })

    // Log aktivitas
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        module: 'AUTH',
        description: `User ${user.username} berhasil login`
      }
    })

  } catch (error) {
    console.error(error)
    return { error: 'Terjadi kesalahan sistem' }
  }

  redirect('/dashboard')
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
          description: 'User logout'
        }
      })
    } catch (e) {
      // Abaikan jika token invalid saat logout
    }
  }

  cookieStore.delete('session')
  redirect('/login')
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  try {
    const { payload } = await jwtVerify(session, key)
    return payload as { userId: string; username: string; name: string; role: string }
  } catch (error) {
    return null
  }
}
