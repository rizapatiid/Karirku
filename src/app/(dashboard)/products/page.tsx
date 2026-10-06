import prisma from '@/lib/prisma'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

// Server Component
export default async function ProductsPage() {
  // Fetch products from remote MySQL
  const products = await prisma.product.findMany({
    include: {
      category: true,
      unit: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  })

  // Format currency
  const formatRupiah = (amount: any) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola data inventaris dan produk jualan Anda</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/categories/create" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition border border-gray-200">
            <Plus size={18} />
            <span>Kategori</span>
          </Link>
          <Link href="/products/create" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
            <Plus size={18} />
            <span>Tambah Produk</span>
          </Link>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Cari nama produk, SKU..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-3 font-semibold">SKU / Nama Produk</th>
                <th className="px-6 py-3 font-semibold">Kategori</th>
                <th className="px-6 py-3 font-semibold text-right">Harga Jual</th>
                <th className="px-6 py-3 font-semibold text-right">Stok</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">{product.name}</span>
                      <span className="text-xs text-gray-500 font-mono mt-0.5">{product.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium">
                      {product.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    {formatRupiah(product.sellingPrice.toNumber())}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-bold ${product.stock <= product.minimumStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock} {product.unit.shortName}
                      </span>
                      {product.stock <= product.minimumStock && (
                        <span className="text-[10px] text-red-500 font-medium">Stok Menipis</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${product.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {product.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 transition" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 transition" title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Belum ada data produk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <div>Menampilkan 1 hingga {products.length} dari {products.length} produk</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>Sebel.</button>
            <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" disabled>Selanj.</button>
          </div>
        </div>

      </div>
    </div>
  )
}
