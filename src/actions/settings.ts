'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from './auth'

async function checkAdminOrOwner() {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'ADMIN')) {
    throw new Error('Unauthorized')
  }
}

export async function updateStoreProfile(formData: FormData) {
  await checkAdminOrOwner()
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
    }
  } catch (error) {
    console.error(error)
    return { error: 'Gagal memperbarui profil toko' }
  }
  revalidatePath('/settings/profile')
  redirect('/settings')
}

export async function updateTaxSettings(formData: FormData) {
  await checkAdminOrOwner()
  try {
    const id = formData.get('id') as string
    const taxActive = formData.get('taxActive') === 'on'
    const taxRate = parseFloat(formData.get('taxRate') as string) || 0
    const serviceCharge = parseFloat(formData.get('serviceCharge') as string) || 0

    if (id) {
      await prisma.store.update({
        where: { id },
        data: { taxActive, taxRate, serviceCharge }
      })
    }
  } catch (error) {
    console.error(error)
    return { error: 'Gagal memperbarui pajak' }
  }
  revalidatePath('/settings/tax')
  redirect('/settings')
}

export async function updateReceiptSettings(formData: FormData) {
  await checkAdminOrOwner()
  try {
    const id = formData.get('id') as string
    const receiptPaperSize = formData.get('receiptPaperSize') as string
    const receiptFooter = formData.get('receiptFooter') as string
    const receiptPromo = formData.get('receiptPromo') as string

    if (id) {
      await prisma.store.update({
        where: { id },
        data: { receiptPaperSize, receiptFooter, receiptPromo }
      })
    }
  } catch (error) {
    console.error(error)
    return { error: 'Gagal memperbarui pengaturan struk' }
  }
  revalidatePath('/settings/receipt')
  redirect('/settings')
}

export async function updatePaymentSettings(formData: FormData) {
  await checkAdminOrOwner()
  try {
    const id = formData.get('id') as string
    const paymentInfo = formData.get('paymentInfo') as string

    if (id) {
      await prisma.store.update({
        where: { id },
        data: { paymentInfo }
      })
    }
  } catch (error) {
    console.error(error)
    return { error: 'Gagal memperbarui pengaturan pembayaran' }
  }
  revalidatePath('/settings/payments')
  redirect('/settings')
}
