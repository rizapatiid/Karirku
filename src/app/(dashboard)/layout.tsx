import Link from 'next/link'
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, FileText, ArrowRightLeft, ShieldCheck, Wallet, DollarSign } from 'lucide-react'
import { getSession } from '@/actions/auth'
import LogoutButton from './LogoutButton'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const role = session.role || 'CASHIER' // Default safe role

  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['OWNER', 'ADMIN', 'CASHIER'] },
    { href: '/pos', icon: ShoppingCart, label: 'POS / Kasir', roles: ['OWNER', 'CASHIER'] },
    { href: '/sales', icon: FileText, label: 'Riwayat Penjualan', roles: ['OWNER', 'ADMIN', 'CASHIER'] },
    { href: '/products', icon: Package, label: 'Produk', roles: ['OWNER', 'ADMIN'] },
    { href: '/stock', icon: ArrowRightLeft, label: 'Pergerakan Stok', roles: ['OWNER', 'ADMIN'] },
    { href: '/purchases', icon: Package, label: 'Pembelian', roles: ['OWNER', 'ADMIN'] },
    { href: '/customers', icon: Users, label: 'Pelanggan', roles: ['OWNER', 'CASHIER'] },
    { href: '/suppliers', icon: Users, label: 'Supplier', roles: ['OWNER', 'ADMIN'] },
    { href: '/finance', icon: Wallet, label: 'Keuangan', roles: ['OWNER'] },
    { href: '/reports', icon: FileText, label: 'Laporan', roles: ['OWNER'] },
    { href: '/audit-logs', icon: ShieldCheck, label: 'Audit Log', roles: ['OWNER'] },
    { href: '/users', icon: Users, label: 'Pengguna (Karyawan)', roles: ['OWNER'] },
    { href: '/settings', icon: Settings, label: 'Pengaturan', roles: ['OWNER'] },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h2 className="text-xl font-bold text-blue-600">KASIRKU</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.filter(item => item.roles.includes(role)).map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition">
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">Sistem POS KASIRKU</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{session.name}</p>
              <p className="text-xs text-gray-500">{session.role}</p>
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
