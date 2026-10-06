import prisma from '@/lib/prisma'
import { ShoppingCart, CheckCircle2, FileText, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/actions/auth'

export default async function CashierDashboard() {
  const session = await getSession()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Get Today's Sales by this specific cashier
  const myTodaySales = await prisma.sale.aggregate({
    where: { 
      transactionDate: { gte: today }, 
      status: 'COMPLETED',
      userId: session?.userId
    },
    _sum: { total: true },
    _count: { id: true }
  })

  const todaysRevenue = Number(myTodaySales._sum.total || 0)
  const todaysCount = myTodaySales._count.id

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-10">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Halo, {session?.name}!</h2>
        <p className="text-gray-500 mt-2 text-lg">Shift Anda telah dimulai. Siap melayani pelanggan?</p>
      </div>

      {/* Action Button */}
      <div className="flex justify-center mb-12">
        <Link href="/pos" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold shadow-xl transition flex items-center gap-3 text-xl hover:scale-105 active:scale-95">
          <ShoppingCart size={28} /> Buka Layar Kasir Sekarang
        </Link>
      </div>

      {/* Cashier KPI Cards */}
      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center border-b pb-4">Statistik Shift Anda Hari Ini</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Struk Diproses</p>
            <h3 className="text-2xl font-bold text-gray-900">{todaysCount} <span className="text-sm font-normal text-gray-500">transaksi</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Nilai Penjualan</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatRupiah(todaysRevenue)}</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
