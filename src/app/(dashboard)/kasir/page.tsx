import prisma from '@/lib/prisma'
import PosClient from './PosClient'

export default async function KasirPage() {
  // Fetch products and format them for the client
  const [products, customers] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        category: true,
        unit: true,
      },
      orderBy: { name: 'asc' }
    }),
    prisma.customer.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    })
  ])

  // Ensure strict formatting (avoiding Prisma decimal issues on client)
  const plainProducts = products.map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    stock: p.stock,
    price: Number(p.sellingPrice),
    category: p.category.name,
    unit: p.unit.shortName,
    imageUrl: p.imageUrl
  }))

  const plainCustomers = customers.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone
  }))

  return <PosClient initialProducts={plainProducts} initialCustomers={plainCustomers} />
}

