'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from './auth'

interface ReturnItemInput {
  productId: string
  quantity: number
  condition: 'GOOD' | 'DAMAGED'
}

interface ReturnInput {
  saleId: string
  reason: string
  items: ReturnItemInput[]
}

export async function processSaleReturn(data: ReturnInput) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Unauthenticated')

    const sale = await prisma.sale.findUnique({
      where: { id: data.saleId },
      include: { items: true }
    })

    if (!sale) throw new Error('Transaksi tidak ditemukan')

    let refundAmount = 0
    const returnNumber = `RET-${new Date().getTime()}`

    await prisma.$transaction(async (tx) => {
      // 1. Create Sale Return Record
      const saleReturn = await tx.saleReturn.create({
        data: {
          saleId: data.saleId,
          returnNumber,
          returnDate: new Date(),
          reason: data.reason,
          status: 'COMPLETED',
          userId: session.userId,
        }
      })

      for (const reqItem of data.items) {
        if (reqItem.quantity <= 0) continue

        const originalItem = sale.items.find(i => i.productId === reqItem.productId)
        if (!originalItem) continue

        // Hitung nominal uang yang dikembalikan per barang (berdasarkan harga jual saat transaksi)
        const itemRefund = Number(originalItem.unitPrice) * reqItem.quantity
        refundAmount += itemRefund

        // 2. Buat record item retur
        await tx.saleReturnItem.create({
          data: {
            saleReturnId: saleReturn.id,
            productId: reqItem.productId,
            quantity: reqItem.quantity,
            condition: reqItem.condition
          }
        })

        // 3. Jika barang layak jual, kembalikan ke stok
        if (reqItem.condition === 'GOOD') {
          const product = await tx.product.findUnique({ where: { id: reqItem.productId } })
          if (product) {
            await tx.product.update({
              where: { id: product.id },
              data: { stock: { increment: reqItem.quantity } }
            })

            await tx.stockMovement.create({
              data: {
                productId: product.id,
                type: 'SALE_RETURN',
                quantity: reqItem.quantity,
                stockBefore: product.stock,
                stockAfter: product.stock + reqItem.quantity,
                referenceType: 'SALE_RETURN',
                referenceId: saleReturn.id,
                userId: session.userId,
                note: `Retur Barang (Layak Jual) - Transaksi: ${sale.invoiceNumber}`
              }
            })
          }
        }
      }

      // 4. Catat Refund di Cash Transaction
      if (refundAmount > 0) {
        await tx.cashTransaction.create({
          data: {
            type: 'REFUND',
            referenceType: 'SALE_RETURN',
            referenceId: saleReturn.id,
            amount: refundAmount,
            userId: session.userId,
            transactionDate: new Date(),
            description: `Refund Retur: ${sale.invoiceNumber}`
          }
        })

        // 5. Update Status Transaksi Induk
        await tx.sale.update({
          where: { id: data.saleId },
          data: { status: 'PARTIALLY_REFUNDED' }
        })
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'CREATE',
          module: 'RETURN',
          referenceId: saleReturn.id,
          description: `Memproses retur ${returnNumber} senilai Rp ${refundAmount}`
        }
      })
    })
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message }
  }

  revalidatePath('/sales')
  revalidatePath('/products')
  revalidatePath('/finance')
  redirect('/sales')
}
