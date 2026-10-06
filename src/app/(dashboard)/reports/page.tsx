import prisma from '@/lib/prisma'
import { FileText, Download } from 'lucide-react'

export default async function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pusat Laporan</h2>
        <p className="text-gray-500 text-sm mt-1">Unduh laporan harian, bulanan, dan kinerja bisnis Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Laporan Penjualan</h3>
          <p className="text-sm text-gray-500 mb-6">Laporan detail tiap transaksi, status bayar, dan total gross sales.</p>
          <a href="/api/reports/sales" className="flex items-center gap-2 w-full justify-center bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-700 font-medium py-2 rounded-lg transition">
            <Download size={18} /> Export Excel
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Laporan Laba Rugi</h3>
          <p className="text-sm text-gray-500 mb-6">Kalkulasi omzet, HPP (Harga Pokok), laba kotor, dan laba bersih.</p>
          <a href="/api/reports/profit" className="flex items-center gap-2 w-full justify-center bg-gray-100 hover:bg-green-50 hover:text-green-600 text-gray-700 font-medium py-2 rounded-lg transition">
            <Download size={18} /> Export Excel
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Laporan Stok Barang</h3>
          <p className="text-sm text-gray-500 mb-6">Posisi stok akhir barang, histori barang masuk, dan barang keluar.</p>
          <a href="/api/reports/stock" className="flex items-center gap-2 w-full justify-center bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-700 font-medium py-2 rounded-lg transition">
            <Download size={18} /> Export Excel
          </a>
        </div>
      </div>
    </div>
  )
}
