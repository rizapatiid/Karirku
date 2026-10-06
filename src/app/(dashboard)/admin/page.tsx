import prisma from '@/lib/prisma'
import { AlertTriangle, Package, Users, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  // 1. Get Low Stock Items
  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lte: 10 }, status: 'ACTIVE' },
    take: 10,
    orderBy: { stock: 'asc' }
  })
  
  const totalProducts = await prisma.product.count({ where: { status: 'ACTIVE' } })
  const totalSuppliers = await prisma.supplier.count({ where: { status: 'ACTIVE' } })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dasbor Gudang & Produk (Admin)</h2>
        <p className="text-gray-500 text-sm mt-1">Pantau pergerakan stok dan ketersediaan barang hari ini</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Produk Aktif</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalProducts} <span className="text-sm font-normal text-gray-500">item</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Supplier</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalSuppliers} <span className="text-sm font-normal text-gray-500">mitra</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Stok Hampir Habis</p>
            <h3 className="text-2xl font-bold text-gray-900">{lowStockProducts.length} <span className="text-sm font-normal text-gray-500">perlu restock</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Widget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Package size={18} className="text-orange-500" /> Daftar Produk Stok Menipis ({"<"} 10)
            </h3>
            <Link href="/products" className="text-sm text-blue-600 hover:underline">Kelola Produk</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-6">Stok semua barang aman.</div>
            ) : (
              lowStockProducts.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-red-50/50 border border-red-100 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                      Sisa {p.stock}
                    </span>
                    <Link href="/purchases/create" className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Order Baru</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            Aksi Cepat Admin
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/products/create" className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 rounded-xl transition text-gray-700 gap-3">
              <Package size={32} />
              <span className="font-medium">Tambah Produk</span>
            </Link>
            <Link href="/stock/adjustment" className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-purple-50 hover:text-purple-600 border border-gray-200 rounded-xl transition text-gray-700 gap-3">
              <ArrowRightLeft size={32} />
              <span className="font-medium">Sesuaikan Stok</span>
            </Link>
            <Link href="/purchases/create" className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-green-50 hover:text-green-600 border border-gray-200 rounded-xl transition text-gray-700 gap-3">
              <Package size={32} />
              <span className="font-medium">Catat Pembelian</span>
            </Link>
            <Link href="/suppliers/create" className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 rounded-xl transition text-gray-700 gap-3">
              <Users size={32} />
              <span className="font-medium">Tambah Supplier</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

