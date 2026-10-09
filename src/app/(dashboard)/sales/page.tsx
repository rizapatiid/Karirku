import prisma from '@/lib/prisma'
import { Search, Eye, ArrowRightLeft } from 'lucide-react'

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    orderBy: { transactionDate: 'desc' },
    include: {
      user: true,
      customer: true
    },
    take: 50 // Limit for MVP
  })

  const formatRupiah = (num: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Riwayat Penjualan</h2>
          <p className="text-gray-500 text-sm mt-1">Daftar semua transaksi yang telah selesai</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari No. Invoice..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-3 font-semibold">No. Invoice</th>
                <th className="px-6 py-3 font-semibold">Tanggal</th>
                <th className="px-6 py-3 font-semibold">Kasir</th>
                <th className="px-6 py-3 font-semibold text-right">Total</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900">{sale.invoiceNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sale.transactionDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.user.name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                    {formatRupiah(sale.total.toNumber())}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <a href={`/receipt/${sale.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 transition" title="Lihat/Cetak Struk">
                        <Eye size={18} />
                      </a>
                      <a href={`/sales/${sale.id}/return`} className="p-1.5 text-gray-400 hover:text-red-600 transition" title="Retur Barang">
                        <ArrowRightLeft size={18} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Belum ada transaksi penjualan.
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
