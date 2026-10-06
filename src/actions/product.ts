'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const sku = formData.get('sku') as string
    const categoryId = formData.get('categoryId') as string
    const unitId = formData.get('unitId') as string
    const purchasePrice = Number(formData.get('purchasePrice'))
    const sellingPrice = Number(formData.get('sellingPrice'))
    const stock = Number(formData.get('stock'))
    const minimumStock = Number(formData.get('minimumStock'))

    const store = await prisma.store.findFirst()

    await prisma.product.create({
      data: {
        name,
        sku,
        categoryId,
        unitId,
        purchasePrice,
        sellingPrice,
        stock,
        minimumStock,
        storeId: store?.id
      }
    })

  } catch (error) {
    console.error(error)
    return { error: 'Gagal menyimpan produk' }
  }

  revalidatePath('/products')
  redirect('/products')
}
