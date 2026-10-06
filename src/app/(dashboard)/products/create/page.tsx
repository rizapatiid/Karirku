import prisma from '@/lib/prisma'
import { createProduct } from '@/actions/product'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CreateProductPage() {
  const categories = await prisma.category.findMany({ where: { status: 'ACTIVE' } })
  const units = await prisma.unit.findMany()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tambah Produk Baru</h2>
          <p className="text-gray-500 text-sm mt-1">Masukkan detail produk jualan Anda</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form action={createProduct as any} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nama Produk</label>
              <input name="name" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SKU / Kode Barang</label>
              <input name="sku" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Kategori</label>
              <select name="categoryId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Pilih Kategori...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Satuan</label>
              <select name="unitId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Pilih Satuan...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Harga Beli (Modal)</label>
              <input type="number" name="purchasePrice" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Harga Jual</label>
              <input type="number" name="sellingPrice" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Stok Awal</label>
              <input type="number" name="stock" required defaultValue={0} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Batas Stok Menipis</label>
              <input type="number" name="minimumStock" required defaultValue={5} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/products" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition">
              Simpan Produk
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

