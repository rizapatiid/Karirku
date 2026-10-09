import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const queues = await prisma.queue.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        label: true,
        status: true,
        calledAt: true,
      }
    })

    return NextResponse.json(queues)
  } catch (error: any) {
    console.error("API /api/queue Error:", error?.message)
    return NextResponse.json([])
  }
}
