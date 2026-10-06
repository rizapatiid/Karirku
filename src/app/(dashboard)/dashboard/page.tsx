import prisma from '@/lib/prisma'
import { Activity } from 'lucide-react'

export default async function DashboardPage() {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))

  // 1. Penjualan Hari Ini
  const todaySales = await prisma.sale.aggregate({
    _sum: { total: true },
    where: {
      transactionDate: { gte: startOfDay, lte: endOfDay },
      status: 'COMPLETED'
    }
  })

  // 2. Transaksi Hari Ini
  const todayTransactionCount = await prisma.sale.count({
    where: {
      transactionDate: { gte: startOfDay, lte: endOfDay },
      status: 'COMPLETED'
    }
  })

  // 3. Stok Menipis
  const lowStockProducts = await prisma.product.count({
    where: {
      stock: { lte: prisma.product.fields.minimumStock },
      status: 'ACTIVE'
    }
  })

  // 4. Laba Hari Ini (Total Penjualan - Total Modal (HPP))
  const todaySaleItems = await prisma.saleItem.findMany({
    where: {
      sale: {
        transactionDate: { gte: startOfDay, lte: endOfDay },
        status: 'COMPLETED'
      }
    }
  })
  
  const hppToday = todaySaleItems.reduce((acc, item) => acc + (Number(item.costPrice) * item.quantity), 0)
  const revenueToday = todaySales._sum.total ? Number(todaySales._sum.total) : 0
  const profitToday = revenueToday - hppToday

  // Fetch recent activities
  const recentSales = await prisma.sale.findMany({
    orderBy: { transactionDate: 'desc' },
    take: 5,
    include: { user: true }
  })

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Cards */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Penjualan Hari Ini</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatRupiah(revenueToday)}</p>
          <span className="text-xs text-green-600 font-medium">Berdasarkan data {today.toLocaleDateString()}</span>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Transaksi Hari Ini</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{todayTransactionCount}</p>
          <span className="text-xs text-gray-500 font-medium">Transaksi berhasil</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Stok Menipis</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">{lowStockProducts}</p>
          <span className="text-xs text-gray-500 font-medium">Produk perlu di-restock</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Laba Hari Ini (Gross)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatRupiah(profitToday)}</p>
          <span className="text-xs text-green-600 font-medium">Penjualan - HPP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Grafik Penjualan</h3>
          <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Activity className="w-12 h-12 text-gray-300 mb-2" />
            <span className="text-gray-400">Modul Chart akan diimplementasikan via Recharts</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terakhir</h3>
          <div className="space-y-4">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{sale.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">Kasir: {sale.user.name}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatRupiah(Number(sale.total))}</span>
              </div>
            ))}
            {recentSales.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-4">Belum ada transaksi</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
