'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from './auth'

export async function createCustomer(formData: FormData) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Unauthenticated')

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const address = formData.get('address') as string

    // Generate Customer Code
    const count = await prisma.customer.count()
    const code = `CUST-${String(count + 1).padStart(4, '0')}`

    const customer = await prisma.customer.create({
      data: {
        code,
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        status: 'ACTIVE'
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE',
        module: 'CUSTOMER',
        referenceId: customer.id,
        description: `Mendaftarkan pelanggan baru: ${name}`
      }
    })
  } catch (error) {
    console.error(error)
    return { error: 'Gagal menyimpan data pelanggan' }
  }

  revalidatePath('/customers')
  redirect('/customers')
}
