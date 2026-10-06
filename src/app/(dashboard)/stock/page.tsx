import prisma from '@/lib/prisma'
import { Search, ArrowRightLeft } from 'lucide-react'

export default async function StockMovementsPage() {
  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: true, user: true },
    take: 100
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pergerakan Stok</h2>
        <p className="text-gray-500 text-sm mt-1">Lacak histori masuk dan keluarnya barang</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari referensi atau nama produk..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-3 font-semibold">Waktu</th>
                <th className="px-6 py-3 font-semibold">Produk</th>
                <th className="px-6 py-3 font-semibold text-center">Tipe</th>
                <th className="px-6 py-3 font-semibold text-right">Perubahan</th>
                <th className="px-6 py-3 font-semibold text-right">Stok Akhir</th>
                <th className="px-6 py-3 font-semibold">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {mov.createdAt.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{mov.product.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                      {mov.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${mov.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    {mov.stockAfter}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[200px]">
                    {mov.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
