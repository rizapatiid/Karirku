'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface CartItem {
  productId: string
  quantity: number
  price: number
}

interface CheckoutData {
  items: CartItem[]
  customerId?: string
  paymentMethod: string
  amountPaid: number
  discount: number
  tax?: number
}

import { getSession } from './auth'

export async function processCheckout(data: CheckoutData) {
  try {
    // Basic validations
    if (!data.items || data.items.length === 0) {
      throw new Error('Keranjang kosong')
    }

    const session = await getSession()
    if (!session) throw new Error('Anda harus login')
    const user = { id: session.userId }
    
    // Default customer if none selected
    let customerId = data.customerId
    if (!customerId) {
      const defaultCust = await prisma.customer.findFirst({ where: { code: 'CUST-0000' } })
      customerId = defaultCust?.id
    }

    // Calculate totals on server to prevent tampering
    let subtotal = 0
    
    // Fetch fresh product data for price and stock validation
    const productIds = data.items.map(item => item.productId)
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    const orderItemsToCreate: any[] = []

    for (const item of data.items) {
      const dbProduct = dbProducts.find(p => p.id === item.productId)
      if (!dbProduct) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`)
      
      if (dbProduct.stock < item.quantity) {
        throw new Error(`Stok ${dbProduct.name} tidak mencukupi (Sisa: ${dbProduct.stock})`)
      }

      const itemSubtotal = Number(dbProduct.sellingPrice) * item.quantity
      subtotal += itemSubtotal

      orderItemsToCreate.push({
        productId: dbProduct.id,
        quantity: item.quantity,
        unitPrice: dbProduct.sellingPrice,
        costPrice: dbProduct.purchasePrice,
        discount: 0,
        subtotal: itemSubtotal
      })
    }

    const total = subtotal - data.discount + (data.tax || 0)
    if (data.amountPaid < total && data.paymentMethod === 'CASH') {
      throw new Error('Pembayaran kurang dari total')
    }

    const changeAmount = data.amountPaid > total ? data.amountPaid - total : 0

    // Generate Invoice Number TRX-YYYYMMDD-SEQUENCE
    const today = new Date()
    const dateStr = today.toISOString().slice(0,10).replace(/-/g, '')
    const countToday = await prisma.sale.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0,0,0,0)),
          lt: new Date(today.setHours(23,59,59,999))
        }
      }
    })
    const invoiceNumber = `TRX-${dateStr}-${String(countToday + 1).padStart(5, '0')}`

    // TRANSACTION BLOCK (ACID)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          userId: user.id,
          customerId: customerId,
          transactionDate: new Date(),
          subtotal,
          discount: data.discount,
        tax: data.tax || 0,
          
          total,
          paidAmount: data.amountPaid,
          changeAmount,
          paymentStatus: 'PAID',
          status: 'COMPLETED',
          items: {
            create: orderItemsToCreate
          }
        }
      })

      // 2. Create Payment
      await tx.payment.create({
        data: {
          saleId: sale.id,
          method: data.paymentMethod,
          amount: data.amountPaid,
          paidAt: new Date()
        }
      })

      // 3 & 4. Update Stock & Create Stock Movements
      for (const item of orderItemsToCreate) {
        const dbProduct = dbProducts.find(p => p.id === item.productId)!
        
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity, // Negative because it's going out
            stockBefore: dbProduct.stock,
            stockAfter: dbProduct.stock - item.quantity,
            referenceType: 'SALE',
            referenceId: sale.id,
            userId: user.id,
            note: `Penjualan ${invoiceNumber}`
          }
        })
      }

      // 5. Create Cash Transaction if CASH
      if (data.paymentMethod === 'CASH') {
        await tx.cashTransaction.create({
          data: {
            type: 'SALE',
            referenceType: 'SALE',
            referenceId: sale.id,
            amount: total, // The actual revenue received
            userId: user.id,
            transactionDate: new Date(),
            description: `Penjualan ${invoiceNumber}`
          }
        })
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          module: 'POS',
          referenceId: sale.id,
          description: `Kasir membuat transaksi ${invoiceNumber}`
        }
      })

      return sale
    })

    revalidatePath('/products')
    revalidatePath('/owner')
    revalidatePath('/admin')
    revalidatePath('/kasir')
    
    return { success: true, invoiceNumber: result.invoiceNumber, saleId: result.id }

  } catch (error: any) {
    console.error("Checkout Error:", error)
    return { success: false, error: error.message }
  }
}


