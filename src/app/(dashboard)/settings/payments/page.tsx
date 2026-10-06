'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PaymentSettingsPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Metode pembayaran berhasil diperbarui!')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Metode Pembayaran</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola rekening dan e-Wallet yang diterima</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 border-b pb-2">Transfer Bank</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bank BCA</label>
                <input placeholder="No Rekening..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Atas Nama (BCA)</label>
                <input placeholder="Nama Pemilik..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bank Mandiri</label>
                <input placeholder="No Rekening..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Atas Nama (Mandiri)</label>
                <input placeholder="Nama Pemilik..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-gray-900 border-b pb-2">e-Wallet / QRIS</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Link QRIS (Opsional)</label>
              <input placeholder="https://..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/settings" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition">
              Simpan Pembayaran
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
