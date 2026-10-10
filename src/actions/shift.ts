'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getCurrentShift(userId: string) {
  try {
    const shift = await prisma.shift.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
      include: {
        user: true,
        sales: {
          include: {
            Payment: true,
          }
        }
      },
      orderBy: {
        startTime: 'desc',
      },
    })
    return shift
  } catch (error) {
    console.error('Error fetching current shift:', error)
    return null
  }
}

export async function openShift({ 
  userId, 
  startCash, 
  employeeCode, 
  selfieUrl, 
  notes 
}: { 
  userId: string; 
  startCash: number; 
  employeeCode?: string; 
  selfieUrl?: string; 
  notes?: string 
}) {
  try {
    // Check if user already has an active open shift
    const existingShift = await prisma.shift.findFirst({
      where: { userId, status: 'OPEN' },
    })

    if (existingShift) {
      return { success: false, error: 'Kasir sudah memiliki shift aktif!' }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    const store = await prisma.store.findFirst()

    const shiftCount = await prisma.shift.count()
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const shiftNumber = `SHIFT-${dateStr}-${String(shiftCount + 1).padStart(4, '0')}`

    const newShift = await prisma.shift.create({
      data: {
        userId,
        storeId: store?.id || user?.storeId || null,
        shiftNumber,
        startCash,
        employeeCode: employeeCode || user?.username || null,
        selfieUrl: selfieUrl || null,
        notes: notes || null,
        status: 'OPEN',
      },
    })

    revalidatePath('/kasir')
    revalidatePath('/shifts')
    return { success: true, shift: newShift }
  } catch (error: any) {
    console.error('Error opening shift:', error)
    return { success: false, error: error.message || 'Gagal membuka shift kasir' }
  }
}

export async function closeShift({ shiftId, actualCash, notes }: { shiftId: string; actualCash: number; notes?: string }) {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        sales: {
          include: {
            Payment: true,
          },
        },
      },
    })

    if (!shift) {
      return { success: false, error: 'Data shift tidak ditemukan' }
    }

    // Calculate shift sales metrics
    let totalSales = 0
    let cashSales = 0
    let nonCashSales = 0

    // Fetch sales for this user during shift timeframe if sales were not explicitly linked by shiftId
    const salesInShift = await prisma.sale.findMany({
      where: {
        userId: shift.userId,
        transactionDate: {
          gte: shift.startTime,
        },
        status: 'COMPLETED',
      },
      include: {
        Payment: true,
      },
    })

    salesInShift.forEach((sale) => {
      const saleTotal = Number(sale.total)
      totalSales += saleTotal
      const isCash = sale.Payment.some((p) => p.method === 'CASH') || sale.Payment.length === 0
      if (isCash) {
        cashSales += saleTotal
      } else {
        nonCashSales += saleTotal
      }
    })

    const startCash = Number(shift.startCash)
    const expectedCash = startCash + cashSales
    const difference = actualCash - expectedCash

    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        endTime: new Date(),
        totalSales,
        cashSales,
        nonCashSales,
        expectedCash,
        actualCash,
        difference,
        notes: notes || shift.notes,
      },
    })

    revalidatePath('/kasir')
    revalidatePath('/shifts')
    return { success: true, shift: updatedShift }
  } catch (error: any) {
    console.error('Error closing shift:', error)
    return { success: false, error: error.message || 'Gagal menutup shift' }
  }
}

export async function getAllShifts() {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        user: true,
        store: true,
      },
      orderBy: {
        startTime: 'desc',
      },
      take: 100,
    })
    return shifts
  } catch (error) {
    console.error('Error fetching all shifts:', error)
    return []
  }
}
