import { createExpense } from '@/actions/finance'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CreateExpensePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Catat Pengeluaran Baru</h2>
          <p className="text-gray-500 text-sm mt-1">Masukkan data pengeluaran operasional toko</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form action={createExpense} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Keterangan / Nama Pengeluaran</label>
            <input 
              name="description" 
              required 
              placeholder="Contoh: Bayar Listrik Bulan Ini, Beli ATK..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nominal (Rp)</label>
            <input 
              type="number" 
              name="amount" 
              required 
              placeholder="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/finance" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition">
              Simpan Pengeluaran
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
