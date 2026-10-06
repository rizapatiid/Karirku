'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateStoreProfile(formData: FormData) {
  try {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string

    if (id) {
      await prisma.store.update({
        where: { id },
        data: { name, phone, address }
      })
    } else {
      await prisma.store.create({
        data: { name, phone, address }
      })
    }
  } catch (error) {
    console.error(error)
    return { error: 'Gagal memperbarui profil toko' }
  }

  revalidatePath('/settings/profile')
  redirect('/settings')
}
