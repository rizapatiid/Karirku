import prisma from '@/lib/prisma'
import { adjustStock } from '@/actions/stock'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function StockAdjustmentPage() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/stock" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Penyesuaian Stok (Stock Opname)</h2>
          <p className="text-gray-500 text-sm mt-1">Sesuaikan stok fisik jika ada barang hilang atau rusak</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form action={adjustStock} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pilih Produk <span className="text-red-500">*</span></label>
            <select name="productId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">-- Cari Produk --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stok Saat Ini: {p.stock})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipe Penyesuaian <span className="text-red-500">*</span></label>
              <select name="type" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="ADJUSTMENT_ADD">Stok Lebih (Tambah)</option>
                <option value="ADJUSTMENT_MINUS">Stok Kurang (Kurangi)</option>
                <option value="DAMAGE">Barang Rusak (Kurangi)</option>
                <option value="LOSS">Barang Hilang (Kurangi)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Jumlah / Qty <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                name="quantity" 
                min="1" 
                required 
                placeholder="Contoh: 2"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Catatan / Alasan</label>
            <textarea 
              name="note" 
              required
              placeholder="Jelaskan alasan penyesuaian (misal: Rusak digigit tikus, salah input sebelumnya)..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" 
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/stock" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition">
              Sesuaikan Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
