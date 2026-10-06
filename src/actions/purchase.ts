'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface PurchaseItemInput {
  productId: string
  quantity: number
  unitCost: number
}

interface PurchaseInput {
  supplierId: string
  items: PurchaseItemInput[]
  status: 'DRAFT' | 'RECEIVED'
  notes?: string
}

import { getSession } from './auth'

export async function createPurchase(data: PurchaseInput) {
  try {
    const session = await getSession()
    if (!session) throw new Error('Anda harus login')
    const user = { id: session.userId }

    let subtotal = 0
    const itemsToCreate = data.items.map(item => {
      const itemSubtotal = item.quantity * item.unitCost
      subtotal += itemSubtotal
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: itemSubtotal
      }
    })

    // Generate PO Number
    const count = await prisma.purchase.count()
    const purchaseNumber = `PO-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}-${String(count + 1).padStart(4, '0')}`

    await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: data.supplierId,
          userId: user.id,
          purchaseDate: new Date(),
          subtotal,
          total: subtotal, // Assuming no tax/discount for simplicity
          status: data.status,
          notes: data.notes,
          items: {
            create: itemsToCreate
          }
        }
      })

      // If status is RECEIVED, update stock immediately
      if (data.status === 'RECEIVED') {
        for (const item of itemsToCreate) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (!product) continue

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          })

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'PURCHASE',
              quantity: item.quantity,
              stockBefore: product.stock,
              stockAfter: product.stock + item.quantity,
              referenceType: 'PURCHASE',
              referenceId: purchase.id,
              userId: user.id,
              note: `Penerimaan Barang PO: ${purchaseNumber}`
            }
          })
        }
      }
      
      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          module: 'PURCHASE',
          referenceId: purchase.id,
          description: `Membuat PO baru ${purchaseNumber} (${data.status})`
        }
      })
    })

  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message }
  }

  revalidatePath('/purchases')
  revalidatePath('/products')
  revalidatePath('/stock')
  
  return { success: true }
}
