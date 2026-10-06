'use client'

import Link from 'next/link'
import { ArrowLeft, Download, UploadCloud } from 'lucide-react'

export default function DatabaseSettingsPage() {
  const handleExport = () => {
    alert('Mengekspor database ke CSV...')
  }
  const handleImport = () => {
    alert('Fitur import segera hadir di versi production!')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Impor & Ekspor Data</h2>
          <p className="text-gray-500 text-sm mt-1">Backup data Anda secara aman atau migrasi dari sistem lama</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
        
        {/* Import Section */}
        <div>
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><UploadCloud size={18} className="text-blue-500" /> Impor Produk Massal (Excel/CSV)</h3>
          <p className="text-sm text-gray-500 mb-4">Pindahkan ribuan data produk Anda dari POS lama cukup dengan sekali unggah.</p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition cursor-pointer" onClick={handleImport}>
            <div className="text-sm font-bold text-blue-600 mb-1">Klik untuk memilih file excel (.xlsx, .csv)</div>
            <p className="text-xs text-gray-400">Pastikan format kolom sesuai dengan template standar KASIRKU</p>
          </div>
          <button className="mt-3 text-xs text-blue-600 font-medium hover:underline">Unduh Template Excel Kosong</button>
        </div>

        <div className="border-t border-gray-100"></div>

        {/* Export Section */}
        <div>
          <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Download size={18} className="text-green-500" /> Backup Keseluruhan Data</h3>
          <p className="text-sm text-gray-500 mb-4">Unduh seluruh riwayat database Anda secara instan sebagai arsip cadangan (Master Produk, Transaksi, Laporan).</p>
          <button onClick={handleExport} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition text-sm">
            Mulai Backup Data (.SQL)
          </button>
        </div>

      </div>
    </div>
  )
}
