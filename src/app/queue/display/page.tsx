import prisma from '@/lib/prisma'
import QueueDisplay from './QueueDisplay'

export default async function QueueDisplayPage() {
  const store = await prisma.store.findFirst()

  return (
    <QueueDisplay
      storeName={store?.name || 'KASIRKU'}
      logoUrl={store?.logoUrl || null}
    />
  )
}
