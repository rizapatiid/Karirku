import Link from 'next/link'
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h2 className="text-xl font-bold text-blue-600">KASIRKU</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/pos" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <ShoppingCart size={20} />
            <span className="font-medium">POS / Kasir</span>
          </Link>
          <Link href="/sales" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <ShoppingCart size={20} />
            <span className="font-medium">Riwayat Penjualan</span>
          </Link>
          <Link href="/products" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <Package size={20} />
            <span className="font-medium">Produk</span>
          </Link>
          <Link href="/stock" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <Package size={20} />
            <span className="font-medium">Pergerakan Stok</span>
          </Link>
          <Link href="/purchases" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <Package size={20} />
            <span className="font-medium">Pembelian</span>
          </Link>
          <Link href="/customers" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <Users size={20} />
            <span className="font-medium">Pelanggan</span>
          </Link>
          <Link href="/finance" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <Settings size={20} />
            <span className="font-medium">Keuangan</span>
          </Link>
          <Link href="/reports" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <Settings size={20} />
            <span className="font-medium">Laporan</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <Settings size={20} />
            <span className="font-medium">Pengaturan</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Link href="/login" className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">Sistem POS KASIRKU</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Admin</p>
              <p className="text-xs text-gray-500">admin@kasirku.local</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
