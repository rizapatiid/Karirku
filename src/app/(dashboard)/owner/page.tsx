import prisma from '@/lib/prisma'
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Package, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import DashboardChart from './components/DashboardChart'
import TopProductsChart from './components/TopProductsChart'

export default async function OwnerDashboardPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Get Today's Sales
  const todaySales = await prisma.sale.aggregate({
    where: { transactionDate: { gte: today }, status: 'COMPLETED' },
    _sum: { total: true },
    _count: { id: true }
  })

  const todaysRevenue = Number(todaySales._sum.total || 0)
  const todaysCount = todaySales._count.id

  // 2. Get Low Stock Items
  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lte: 10 }, status: 'ACTIVE' },
    take: 5,
    orderBy: { stock: 'asc' }
  })
  
  const totalLowStock = await prisma.product.count({
    where: { stock: { lte: 10 }, status: 'ACTIVE' }
  })

  // 3. Calculate Gross Profit (This month)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const monthSales = await prisma.sale.findMany({
    where: { transactionDate: { gte: startOfMonth }, status: 'COMPLETED' },
    include: { items: true }
  })

  let monthRevenue = 0
  let monthHPP = 0

  monthSales.forEach(sale => {
    monthRevenue += Number(sale.total)
    sale.items.forEach(item => {
      monthHPP += (Number(item.costPrice) * item.quantity)
    })
  })

  const grossProfit = monthRevenue - monthHPP

  // 4. Get last 7 days data for chart
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const recentSales = await prisma.sale.findMany({
    where: { transactionDate: { gte: sevenDaysAgo }, status: 'COMPLETED' },
    select: { transactionDate: true, total: true }
  })

  // Group by date
  const chartDataMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    chartDataMap[label] = 0
  }

  recentSales.forEach(sale => {
    const label = sale.transactionDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    if (chartDataMap[label] !== undefined) {
      chartDataMap[label] += Number(sale.total)
    }
  })

  const chartData = Object.keys(chartDataMap).map(key => ({
    date: key,
    revenue: chartDataMap[key]
  }))

  // 5. Top 5 Best Selling Products (All Time or Month)
  const topItemsRaw = await prisma.saleItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5
  })
  
  const productIds = topItemsRaw.map(t => t.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
  
  const topProductsData = topItemsRaw.map(t => {
    const p = products.find(prod => prod.id === t.productId)
    return {
      name: p ? p.name.substring(0, 15) + (p.name.length > 15 ? '...' : '') : 'Unknown',
      value: t._sum.quantity || 0
    }
  })

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ringkasan Bisnis</h2>
          <p className="text-gray-500 text-sm mt-1">Pantau performa penjualan dan inventaris Anda hari ini</p>
        </div>
        <Link href="/kasir" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition">
          Buka Kasir (POS)
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pendapatan Hari Ini</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatRupiah(todaysRevenue)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><ShoppingBag size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Transaksi Hari Ini</p>
            <h3 className="text-2xl font-bold text-gray-900">{todaysCount} <span className="text-sm font-normal text-gray-500">struk</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Laba Kotor (Bulan Ini)</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatRupiah(grossProfit)}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Stok Menipis</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalLowStock} <span className="text-sm font-normal text-gray-500">barang</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" /> Grafik Penjualan (7 Hari Terakhir)
          </h3>
          <DashboardChart data={chartData} />
        </div>

        <div className="space-y-6">
          {/* Top Selling Products Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" /> Top 5 Produk Terlaris
            </h3>
            {topProductsData.length > 0 ? (
              <TopProductsChart data={topProductsData} />
            ) : (
              <div className="text-center text-gray-500 text-sm py-10">Belum ada data penjualan.</div>
            )}
          </div>

          {/* Low Stock Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Package size={18} className="text-orange-500" /> Peringatan Stok
              </h3>
              <Link href="/products" className="text-sm text-blue-600 hover:underline">Lihat Semua</Link>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-6">Stok semua barang aman.</div>
              ) : (
                lowStockProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-red-50/50 border border-red-100 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                        Sisa {p.stock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Quick Management Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center justify-between">
              <span>Pengelolaan Sistem</span>
              <Users size={18} className="text-blue-500" />
            </h3>
            <p className="text-xs text-gray-500 mb-4">Kelola akun staff, role, dan hak akses toko</p>
            <Link
              href="/users"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Users size={16} />
              <span>Kelola Akun & Karyawan</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


