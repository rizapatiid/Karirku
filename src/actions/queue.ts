'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from './auth'

// Get today's queue list
export async function getTodayQueues() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return prisma.queue.findMany({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    },
    orderBy: { number: 'asc' }
  })
}

// Get next available queue number for today
async function getNextQueueNumber(): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const last = await prisma.queue.findFirst({
    where: { createdAt: { gte: today, lt: tomorrow } },
    orderBy: { number: 'desc' }
  })
  return (last?.number ?? 0) + 1
}

// Add new queue entry
export async function addQueue(label: string = '') {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const store = await prisma.store.findFirst()
  const number = await getNextQueueNumber()

  await prisma.queue.create({
    data: {
      storeId: store?.id,
      number,
      label: label.trim(),
      status: 'WAITING'
    }
  })

  revalidatePath('/queue')
}

// Call a queue number (set to CALLED)
export async function callQueue(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  // Mark any currently CALLED/SERVING as DONE first
  await prisma.queue.updateMany({
    where: { status: { in: ['CALLED', 'SERVING'] } },
    data: { status: 'DONE', servedAt: new Date() }
  })

  await prisma.queue.update({
    where: { id },
    data: { status: 'CALLED', calledAt: new Date() }
  })

  revalidatePath('/queue')
}

// Mark queue as SERVING (customer arrived)
export async function serveQueue(id: string) {
  await prisma.queue.update({
    where: { id },
    data: { status: 'SERVING', servedAt: new Date() }
  })
  revalidatePath('/queue')
}

// Skip a queue number
export async function skipQueue(id: string) {
  await prisma.queue.update({
    where: { id },
    data: { status: 'SKIPPED' }
  })
  revalidatePath('/queue')
}

// Mark as DONE
export async function doneQueue(id: string) {
  await prisma.queue.update({
    where: { id },
    data: { status: 'DONE', servedAt: new Date() }
  })
  revalidatePath('/queue')
}

// Reset all today's queue
export async function resetTodayQueue() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  await prisma.queue.deleteMany({
    where: { createdAt: { gte: today, lt: tomorrow } }
  })

  revalidatePath('/queue')
}

// Call next WAITING queue automatically
export async function callNextQueue() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  // Mark any CALLED/SERVING as DONE
  await prisma.queue.updateMany({
    where: { status: { in: ['CALLED', 'SERVING'] } },
    data: { status: 'DONE', servedAt: new Date() }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const next = await prisma.queue.findFirst({
    where: {
      status: 'WAITING',
      createdAt: { gte: today, lt: tomorrow }
    },
    orderBy: { number: 'asc' }
  })

  if (!next) return null

  await prisma.queue.update({
    where: { id: next.id },
    data: { status: 'CALLED', calledAt: new Date() }
  })

  revalidatePath('/queue')
  return next.number
}
