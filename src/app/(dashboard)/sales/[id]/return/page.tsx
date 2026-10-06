import prisma from '@/lib/prisma'
import ReturnClient from './ReturnClient'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const sale = await prisma.sale.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: {
        include: { product: true }
      }
    }
  })

  if (!sale) redirect('/sales')

  // Format the data for the client
  const plainSale = {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    items: sale.items.map(i => ({
      productId: i.productId,
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal)
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sales" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Proses Retur Transaksi</h2>
          <p className="text-gray-500 text-sm mt-1">Invoice: {sale.invoiceNumber}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <ReturnClient sale={plainSale} />
      </div>
    </div>
  )
}
