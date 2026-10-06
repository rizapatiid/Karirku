'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TaxSettingsPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Konfigurasi pajak berhasil disimpan!')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pajak & Biaya Layanan</h2>
          <p className="text-gray-500 text-sm mt-1">Atur persentase PPN dan Service Charge otomatis di kasir</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h4 className="font-bold text-gray-900">Pajak Pertambahan Nilai (PPN)</h4>
                <p className="text-xs text-gray-500">Aktifkan jika bisnis Anda PKP</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Persentase PPN (%)</label>
              <input type="number" defaultValue="11" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium text-gray-700">Service Charge (%) - Khusus F&B</label>
              <input type="number" defaultValue="0" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/settings" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
