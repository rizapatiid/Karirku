import prisma from '@/lib/prisma'
import PosClient from './PosClient'

export default async function KasirPage() {
  // Fetch products, categories, customers, and store info
  const [products, categories, customers, store] = await Promise.all([
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
    prisma.store.findFirst()
  ])

  // Ensure strict formatting for client components
  const plainProducts = products.map(p => ({
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

  const plainCategories = categories.map(c => ({
    id: c.id,
    name: c.name
  }))

  const plainCustomers = customers.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone
  }))

  return (
    <PosClient
      initialProducts={plainProducts}
      initialCategories={plainCategories}
      initialCustomers={plainCustomers}
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
}
