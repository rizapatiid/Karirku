'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from './auth'

export async function createSupplier(formData: FormData) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Unauthenticated')

    const name = formData.get('name') as string
    const contact = formData.get('contactPerson') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const address = formData.get('address') as string

    // Generate Supplier Code
    const count = await prisma.supplier.count()
    const code = `SUP-${String(count + 1).padStart(4, '0')}`

    const supplier = await prisma.supplier.create({
      data: {
        code,
        name,
        contact: contact || null,
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
        module: 'SUPPLIER',
        referenceId: supplier.id,
        description: `Menambahkan supplier baru: ${name}`
      }
    })
  } catch (error) {
    console.error(error)
    return { error: 'Gagal menyimpan data supplier' }
  }

  revalidatePath('/suppliers')
  redirect('/suppliers')
}


