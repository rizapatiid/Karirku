import prisma from '@/lib/prisma'
import { Plus, Search, Truck } from 'lucide-react'
import Link from 'next/link'

export default async function PurchasesPage() {
  const purchases = await prisma.purchase.findMany({
    orderBy: { purchaseDate: 'desc' },
    include: {
      supplier: true,
      user: true
    }
  })

  const formatRupiah = (num: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pembelian & Stok Masuk</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola barang masuk (Purchase Order) dari supplier</p>
        </div>
        <Link href="/purchases/create" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          <Plus size={18} />
          <span>Buat Pembelian</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari PO / Supplier..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-3 font-semibold">Nomor PO</th>
                <th className="px-6 py-3 font-semibold">Tanggal</th>
                <th className="px-6 py-3 font-semibold">Supplier</th>
                <th className="px-6 py-3 font-semibold text-right">Total Nilai</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{purchase.purchaseNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {purchase.purchaseDate.toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{purchase.supplier.name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    {formatRupiah(purchase.total.toNumber())}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium 
                      ${purchase.status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 
                        purchase.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {purchase.status}
                    </span>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                    <Truck className="w-12 h-12 text-gray-300 mb-3 mx-auto" />
                    Belum ada riwayat pembelian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
