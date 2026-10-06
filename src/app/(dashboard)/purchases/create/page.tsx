import prisma from '@/lib/prisma'
import PurchaseForm from './PurchaseForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CreatePurchasePage() {
  const suppliers = await prisma.supplier.findMany({ where: { status: 'ACTIVE' } })
  const products = await prisma.product.findMany({ where: { status: 'ACTIVE' } })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchases" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Buat Purchase Order Baru</h2>
          <p className="text-gray-500 text-sm mt-1">Catat pembelian barang dari Supplier untuk menambah stok</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <PurchaseForm 
          suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))} 
          products={products.map(p => ({ id: p.id, name: p.name, price: Number(p.purchasePrice) }))} 
        />
      </div>
    </div>
  )
}
