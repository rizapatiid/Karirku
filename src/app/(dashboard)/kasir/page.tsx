import prisma from '@/lib/prisma'
import PosClient from './PosClient'

// Helper function to retry DB queries when remote Hostinger connection experiences cold start or latency (P1001)
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 800): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return withRetry(fn, retries - 1, delayMs * 1.5)
    }
    throw error
  }
}

import { getSession } from '@/actions/auth'
import { getCurrentShift } from '@/actions/shift'

export default async function KasirPage() {
  try {
    const session = await getSession()
    const activeShift = session ? await getCurrentShift(session.userId) : null

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Fetch products, categories, customers, store, active employees, shift schedules, today attendances, and closed shifts today
    const [products, categories, customers, store, employees, shiftSchedules, attendances, closedShifts] = await withRetry(() => 
      Promise.all([
        prisma.product.findMany({
          where: { status: 'ACTIVE' },
          include: {
            category: true,
            unit: true,
          },
          orderBy: { name: 'asc' }
        }),
        prisma.category.findMany({
          orderBy: { name: 'asc' }
        }),
        prisma.customer.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { name: 'asc' }
        }),
        prisma.store.findFirst(),
        prisma.user.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true, name: true, username: true }
        }),
        prisma.shiftSchedule.findMany({
          where: { status: 'ACTIVE' },
          orderBy: { startTime: 'asc' }
        }),
        prisma.attendance.findMany({
          where: {
            clockIn: { gte: todayStart },
            clockOut: null
          },
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          },
          orderBy: { clockIn: 'desc' }
        }),
        prisma.shift.findMany({
          where: {
            startTime: { gte: todayStart },
            status: 'CLOSED'
          },
          orderBy: { endTime: 'desc' }
        })
      ])
    )

    // Ensure strict formatting for client components
    const plainProducts = (products || []).map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      price: Number(p.sellingPrice),
      category: p.category.name,
      categoryId: p.categoryId,
      unit: p.unit.shortName,
      imageUrl: p.imageUrl
    }))

    const plainCategories = (categories || []).map(c => ({
      id: c.id,
      name: c.name
    }))

    const plainCustomers = (customers || []).map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone
    }))

    const plainEmployees = (employees || []).map(e => ({
      id: e.id,
      name: e.name,
      username: e.username
    }))

    const plainAttendances = (attendances || []).map(a => ({
      id: a.id,
      userId: a.userId,
      userName: a.user.name,
      username: a.user.username,
      roleType: a.roleType,
      selfieIn: a.selfieIn,
      clockIn: a.clockIn.toISOString()
    }))

    const serializedShift = activeShift ? {
      id: activeShift.id,
      shiftNumber: activeShift.shiftNumber,
      startTime: typeof activeShift.startTime === 'string' ? activeShift.startTime : new Date(activeShift.startTime).toISOString(),
      startCash: Number(activeShift.startCash),
      notes: activeShift.notes
    } : null

    const loggedInUser = session?.userId 
      ? (employees || []).find(e => e.id === session.userId) 
      : null

    return (
      <PosClient
        initialProducts={plainProducts}
        initialCategories={plainCategories}
        initialCustomers={plainCustomers}
        initialEmployees={plainEmployees}
        initialShiftSchedules={JSON.parse(JSON.stringify(shiftSchedules || []))}
        todayAttendances={plainAttendances}
        todayClosedShifts={JSON.parse(JSON.stringify(closedShifts || []))}
        currentUser={{ id: session?.userId || '', name: loggedInUser?.name || session?.name || 'Kasir' }}
        initialSelfie={session?.selfie || null}
        initialShift={serializedShift}
        storeConfig={{
          name: store?.name || 'KASIRKU POS',
          taxActive: store?.taxActive || false,
          taxRate: store?.taxRate || 11,
          serviceCharge: store?.serviceCharge || 0,
          receiptFooter: store?.receiptFooter || '',
          paymentInfo: store?.paymentInfo || ''
        }}
      />
    )
  } catch (err: any) {
    console.error("KasirPage DB Connection Error:", err?.message)
    // Safe fallback if Hostinger DB is completely unreachable
    return (
      <PosClient
        initialProducts={[]}
        initialCategories={[]}
        initialCustomers={[]}
        storeConfig={{
          name: 'KASIRKU POS',
          taxActive: false,
          taxRate: 11,
          serviceCharge: 0,
          receiptFooter: '',
          paymentInfo: ''
        }}
      />
    )
  }
}
