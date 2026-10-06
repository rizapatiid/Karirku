import prisma from '@/lib/prisma'
import { Plus, Search, Truck } from 'lucide-react'
import Link from 'next/link'

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { purchases: true } }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Supplier</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola data pemasok barang dan riwayat pembelian</p>
        </div>
        <Link href="/suppliers/create" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          <Plus size={18} />
          <span>Tambah Supplier</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama atau telepon supplier..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-3 font-semibold">Kode</th>
                <th className="px-6 py-3 font-semibold">Nama Supplier</th>
                <th className="px-6 py-3 font-semibold">Kontak Person</th>
                <th className="px-6 py-3 font-semibold">Telepon</th>
                <th className="px-6 py-3 font-semibold text-center">Jumlah PO</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map((sup) => (
                <tr key={sup.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{sup.code || '-'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Truck size={16} />
                    </div>
                    {sup.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sup.contact || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sup.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 text-center">
                    {sup._count.purchases}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium 
                      ${sup.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {sup.status}
                    </span>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Belum ada data supplier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

