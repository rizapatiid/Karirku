'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from './auth'

export async function createCategory(formData: FormData) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Unauthenticated')

    const name = formData.get('name') as string
    const description = formData.get('description') as string

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        status: 'ACTIVE'
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE',
        module: 'CATEGORY',
        referenceId: category.id,
        description: `Menambahkan kategori baru: ${name}`
      }
    })
  } catch (error) {
    console.error(error)
    return { error: 'Gagal menyimpan kategori' }
  }

  revalidatePath('/products')
  redirect('/products') // Redirecting back to products or categories page
}
