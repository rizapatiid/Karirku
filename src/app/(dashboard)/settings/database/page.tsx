import Link from 'next/link'
import { ArrowLeft, Database, Download, Upload, AlertTriangle } from 'lucide-react'

export default function DatabaseSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Database & Backup</h2>
          <p className="text-gray-500 text-sm mt-1">Manajemen pencadangan data sistem</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 text-yellow-800">
        <AlertTriangle className="shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold">Database Dikelola Hostinger</h4>
          <p className="text-sm mt-1">Sistem saat ini terhubung langsung ke Remote MySQL Hostinger. Backup otomatis dikelola oleh server secara berkala. Tombol di bawah ini digunakan untuk pencadangan lokal tambahan.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Download size={24} /></div>
            <div>
              <h3 className="font-bold text-gray-800">Backup Data Lokal</h3>
              <p className="text-sm text-gray-500 mt-1">Unduh seluruh data transaksi dalam format .CSV</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition">
            Unduh Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}
