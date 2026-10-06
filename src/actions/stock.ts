'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from './auth'

export async function adjustStock(formData: FormData) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Unauthenticated')

    const productId = formData.get('productId') as string
    const rawType = formData.get('type') as string
    const type = (rawType === 'LOSS' ? 'LOST' : (rawType.startsWith('ADJUSTMENT') ? 'ADJUSTMENT' : rawType)) as any
    const quantity = Number(formData.get('quantity'))
    const note = formData.get('note') as string

    if (!productId || quantity <= 0) {
      throw new Error('Data tidak valid')
    }

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } })
      if (!product) throw new Error('Produk tidak ditemukan')

      let stockChange = quantity
      if (rawType === 'ADJUSTMENT_MINUS' || type === 'DAMAGE' || type === 'LOST') {
        stockChange = -Math.abs(quantity)
      } else {
        stockChange = Math.abs(quantity)
      }

      const newStock = product.stock + stockChange

      if (newStock < 0) {
        throw new Error('Stok tidak bisa minus')
      }

      await tx.product.update({
        where: { id: productId },
        data: { stock: newStock }
      })

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity: stockChange,
          stockBefore: product.stock,
          stockAfter: newStock,
          userId: session.userId,
          note: note || `Penyesuaian stok sistem (${type})`
        }
      })

      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'UPDATE',
          module: 'INVENTORY',
          referenceId: movement.id,
          description: `Melakukan penyesuaian stok ${product.name} sejumlah ${stockChange}`
        }
      })
    })

  } catch (error: any) {
    console.error(error)
    return { error: error.message || 'Gagal menyesuaikan stok' }
  }

  revalidatePath('/stock')
  revalidatePath('/products')
  redirect('/stock')
}



