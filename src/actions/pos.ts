'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from './auth'

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

export async function processCheckout(data: CheckoutData) {
  try {
    // Basic validations
    if (!data.items || data.items.length === 0) {
      throw new Error('Keranjang kosong')
    }

    const session = await getSession()
    if (!session) throw new Error('Anda harus login')
    const user = { id: session.userId }
    
    // Default customer & Store pre-fetch outside transaction
    const [defaultCust, store] = await Promise.all([
      !data.customerId ? prisma.customer.findFirst({ where: { code: 'CUST-0000' } }) : null,
      prisma.store.findFirst()
    ])

    const customerId = data.customerId || defaultCust?.id

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

    // Date range preparation for queries
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const dateStr = `${year}${month}${day}`

    // TRANSACTION BLOCK (ACID) with extended 30s timeout for remote Hostinger DB latency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate today's Queue Number
      const lastQueueToday = await tx.queue.findFirst({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay }
        },
        orderBy: { number: 'desc' }
      })
      const queueNumber = (lastQueueToday?.number || 0) + 1

      // 2. Generate Invoice Number
      const lastSaleToday = await tx.sale.findFirst({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay }
        },
        orderBy: { createdAt: 'desc' }
      })

      let nextSeq = 1
      if (lastSaleToday && lastSaleToday.invoiceNumber) {
        const parts = lastSaleToday.invoiceNumber.split('-')
        const lastSeq = parseInt(parts[parts.length - 1], 10)
        if (!isNaN(lastSeq) && lastSeq >= nextSeq) {
          nextSeq = lastSeq + 1
        }
      }

      const totalToday = await tx.sale.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } }
      })
      if (totalToday >= nextSeq) {
        nextSeq = totalToday + 1
      }

      const invoiceNumber = `TRX-${dateStr}-${String(nextSeq).padStart(5, '0')}`

      // 2.5 Check active open shift for cashier
      const activeShift = await tx.shift.findFirst({
        where: { userId: user.id, status: 'OPEN' }
      })

      // 3. Create Sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          queueNumber,
          userId: user.id,
          shiftId: activeShift?.id || null,
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

      // 4. Automatically create Queue entry for live queue tracking board
      await tx.queue.create({
        data: {
          storeId: store?.id,
          number: queueNumber,
          label: invoiceNumber,
          status: 'WAITING'
        }
      })

      // 5. Create Payment
      await tx.payment.create({
        data: {
          saleId: sale.id,
          method: data.paymentMethod,
          amount: data.amountPaid,
          paidAt: new Date()
        }
      })

      // 6. Update Stock & Create Stock Movements
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
            quantity: -item.quantity,
            stockBefore: dbProduct.stock,
            stockAfter: dbProduct.stock - item.quantity,
            referenceType: 'SALE',
            referenceId: sale.id,
            userId: user.id,
            note: `Penjualan ${invoiceNumber}`
          }
        })
      }

      // 7. Create Cash Transaction if CASH
      if (data.paymentMethod === 'CASH') {
        await tx.cashTransaction.create({
          data: {
            type: 'SALE',
            referenceType: 'SALE',
            referenceId: sale.id,
            amount: total,
            userId: user.id,
            transactionDate: new Date(),
            description: `Penjualan ${invoiceNumber}`
          }
        })
      }

      // 8. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          module: 'POS',
          referenceId: sale.id,
          description: `Kasir membuat transaksi ${invoiceNumber} (Antrian #${queueNumber})`
        }
      })

      return sale
    }, {
      timeout: 30000, // 30 seconds timeout to handle remote Hostinger DB latency
      maxWait: 10000   // 10 seconds max wait to acquire transaction connection
    })

    revalidatePath('/products')
    revalidatePath('/owner')
    revalidatePath('/admin')
    revalidatePath('/kasir')
    revalidatePath('/queue')
    
    return { 
      success: true, 
      invoiceNumber: result.invoiceNumber, 
      saleId: result.id,
      queueNumber: result.queueNumber 
    }

  } catch (error: any) {
    console.error("Checkout Error:", error)
    return { success: false, error: error.message }
  }
}
