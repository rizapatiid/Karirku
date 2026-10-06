import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')

  // 1. Setup Roles
  const ownerRole = await prisma.role.upsert({
    where: { name: 'OWNER' },
    update: {},
    create: { name: 'OWNER', description: 'Pemilik Bisnis' },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Admin Sistem' },
  })

  const kasirRole = await prisma.role.upsert({
    where: { name: 'KASIR' },
    update: {},
    create: { name: 'KASIR', description: 'Kasir Toko' },
  })

  // 2. Create Store
  const store = await prisma.store.create({
    data: {
      name: 'Toko Kasirku Utama',
      address: 'Jl. Contoh No. 123, Jakarta',
      phone: '081234567890',
    },
  })

  // 3. Create Users
  const passwordHash = await bcrypt.hash('password123', 10)

  await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      name: 'Owner',
      username: 'owner',
      email: 'owner@kasirku.local',
      passwordHash,
      roleId: ownerRole.id,
      storeId: store.id,
    },
  })

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      username: 'admin',
      email: 'admin@kasirku.local',
      passwordHash,
      roleId: adminRole.id,
      storeId: store.id,
    },
  })

  await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      name: 'Kasir',
      username: 'kasir',
      email: 'kasir@kasirku.local',
      passwordHash,
      roleId: kasirRole.id,
      storeId: store.id,
    },
  })

  // 4. Create Customer Umum
  await prisma.customer.upsert({
    where: { code: 'CUST-0000' },
    update: {},
    create: {
      code: 'CUST-0000',
      name: 'Customer Umum',
      notes: 'Pelanggan default tanpa registrasi',
    },
  })

  // 5. Create Categories
  const catMakanan = await prisma.category.create({ data: { name: 'Makanan', slug: 'makanan' } })
  const catMinuman = await prisma.category.create({ data: { name: 'Minuman', slug: 'minuman' } })
  const catSnack = await prisma.category.create({ data: { name: 'Snack', slug: 'snack' } })

  // 6. Create Unit
  const unitPcs = await prisma.unit.create({ data: { name: 'Pieces', shortName: 'pcs' } })

  // 7. Create Supplier
  const supplier = await prisma.supplier.create({
    data: {
      code: 'SUPP-001',
      name: 'CV Maju Jaya',
      contact: 'Pak Budi',
      phone: '08111222333',
    },
  })

  // 8. Create Products
  const prodKopi = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: catMinuman.id,
      unitId: unitPcs.id,
      sku: 'PRD-001',
      name: 'Kopi Susu',
      purchasePrice: 10000,
      sellingPrice: 15000,
      stock: 20,
      minimumStock: 5,
    },
  })

  const prodTeh = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: catMinuman.id,
      unitId: unitPcs.id,
      sku: 'PRD-002',
      name: 'Es Teh',
      purchasePrice: 3000,
      sellingPrice: 5000,
      stock: 50,
      minimumStock: 10,
    },
  })

  const prodMie = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: catMakanan.id,
      unitId: unitPcs.id,
      sku: 'PRD-003',
      name: 'Mie Goreng',
      purchasePrice: 12000,
      sellingPrice: 20000,
      stock: 30,
      minimumStock: 5,
    },
  })

  // 9. Initial Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: prodKopi.id,
        type: 'OPENING_STOCK',
        quantity: 20,
        stockBefore: 0,
        stockAfter: 20,
        userId: admin.id,
        note: 'Seeding awal',
      },
      {
        productId: prodTeh.id,
        type: 'OPENING_STOCK',
        quantity: 50,
        stockBefore: 0,
        stockAfter: 50,
        userId: admin.id,
        note: 'Seeding awal',
      },
      {
        productId: prodMie.id,
        type: 'OPENING_STOCK',
        quantity: 30,
        stockBefore: 0,
        stockAfter: 30,
        userId: admin.id,
        note: 'Seeding awal',
      },
    ],
  })

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
