import prisma from '@/lib/prisma'
import { Plus, Search, Wallet, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function FinancePage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { expenseDate: 'desc' },
    include: { user: true, category: true }
  })

  const cashTransactions = await prisma.cashTransaction.findMany({
    orderBy: { transactionDate: 'desc' },
    take: 10
  })

  const formatRupiah = (num: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Keuangan & Kas</h2>
        <p className="text-gray-500 text-sm mt-1">Pantau arus kas dan kelola pengeluaran operasional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={24} /></div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pengeluaran (Bulan Ini)</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatRupiah(expenses.reduce((acc, curr) => acc + Number(curr.amount), 0))}
              </p>
            </div>
          </div>
          <Link href="/finance/create" className="block text-center w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition">
            + Catat Pengeluaran Baru
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={24} /></div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pemasukan Kas (Bulan Ini)</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatRupiah(cashTransactions.filter(t => t.type === 'SALE' || t.type === 'MANUAL_IN').reduce((acc, curr) => acc + Number(curr.amount), 0))}
              </p>
            </div>
          </div>
          <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition">
            Lihat Laporan Arus Kas
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Wallet size={18} /> Histori Transaksi Kas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-3 font-semibold">Tanggal</th>
                <th className="px-6 py-3 font-semibold">Keterangan</th>
                <th className="px-6 py-3 font-semibold text-center">Tipe</th>
                <th className="px-6 py-3 font-semibold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cashTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {trx.transactionDate.toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{trx.description}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold uppercase
                      ${(trx.type === 'SALE' || trx.type === 'MANUAL_IN') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {(trx.type === 'SALE' || trx.type === 'MANUAL_IN') ? 'MASUK' : 'KELUAR'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${(trx.type === 'SALE' || trx.type === 'MANUAL_IN') ? 'text-green-600' : 'text-red-600'}`}>
                    {(trx.type === 'SALE' || trx.type === 'MANUAL_IN') ? '+' : '-'}{formatRupiah(trx.amount.toNumber())}
                  </td>
                </tr>
              ))}
              {cashTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    Belum ada transaksi kas.
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
