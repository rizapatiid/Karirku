import prisma from '@/lib/prisma'
import QueueClient from './QueueClient'

export default async function QueuePage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const queues = await prisma.queue.findMany({
    where: { createdAt: { gte: today, lt: tomorrow } },
    orderBy: { number: 'asc' }
  })

  const plain = queues.map(q => ({
    id: q.id,
    number: q.number,
    label: q.label,
    status: q.status as any,
    calledAt: q.calledAt,
    servedAt: q.servedAt,
    createdAt: q.createdAt,
  }))

  return <QueueClient initialQueues={plain} />
}
