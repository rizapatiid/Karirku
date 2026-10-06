'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ReceiptSettingsPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Pengaturan struk berhasil disimpan!')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pengaturan Struk</h2>
          <p className="text-gray-500 text-sm mt-1">Sesuaikan tampilan cetak struk kasir</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Ukuran Kertas Printer</label>
            <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="58mm">Printer Thermal 58mm</option>
              <option value="80mm">Printer Thermal 80mm</option>
              <option value="A4">A4 / Normal</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pesan Catatan Kaki (Footer)</label>
            <textarea 
              defaultValue="Barang yang sudah dibeli tidak dapat ditukar/dikembalikan. Terima kasih."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" 
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Teks Promo (Opsional)</label>
            <textarea 
              placeholder="Contoh: Dapatkan diskon 10% untuk pembelian berikutnya!"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" 
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/settings" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition">
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
