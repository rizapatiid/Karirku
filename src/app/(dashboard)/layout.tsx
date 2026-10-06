import Link from 'next/link'
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, FileText, ArrowRightLeft, ShieldCheck, Wallet } from 'lucide-react'
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

  const role = session.role || 'CASHIER'

  const dashboardHref = role === 'OWNER' ? '/owner' : (role === 'ADMIN' ? '/admin' : '/kasir')
  const dashboardLabel = role === 'OWNER' ? 'Dasbor Pemilik' : (role === 'ADMIN' ? 'Dasbor Gudang' : 'Mesin Kasir')

  const menuItems = [
    { href: dashboardHref, icon: LayoutDashboard, label: dashboardLabel, roles: ['OWNER', 'ADMIN', 'CASHIER'] },
    { href: '/kasir', icon: ShoppingCart, label: 'Buka POS Kasir', roles: ['OWNER'] },
    { href: '/sales', icon: FileText, label: 'Riwayat Penjualan', roles: ['OWNER', 'ADMIN', 'CASHIER'] },
    { href: '/products', icon: Package, label: 'Produk', roles: ['OWNER', 'ADMIN'] },
    { href: '/stock', icon: ArrowRightLeft, label: 'Pergerakan Stok', roles: ['OWNER', 'ADMIN'] },
    { href: '/purchases', icon: Package, label: 'Pembelian', roles: ['OWNER', 'ADMIN'] },
    { href: '/customers', icon: Users, label: 'Pelanggan', roles: ['OWNER', 'CASHIER'] },
    { href: '/suppliers', icon: Users, label: 'Supplier', roles: ['OWNER', 'ADMIN'] },
    { href: '/finance', icon: Wallet, label: 'Keuangan', roles: ['OWNER'] },
    { href: '/reports', icon: FileText, label: 'Laporan', roles: ['OWNER'] },
    { href: '/audit-logs', icon: ShieldCheck, label: 'Audit Log', roles: ['OWNER'] },
    { href: '/users', icon: Users, label: 'Pengguna (Role)', roles: ['OWNER'] },
    { href: '/settings', icon: Settings, label: 'Pengaturan Pro', roles: ['OWNER'] },
  ]

  // Remove duplicate POS Kasir for Cashier since it's already their dashboardHref
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(role))

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-blue-600 text-white">
          <h2 className="text-xl font-bold tracking-wider">KASIRKU</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredMenuItems.map(item => (
            <Link key={item.href + item.label} href={item.href} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition">
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">Sistem POS Pro</h1>
          <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-inner">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="pr-2">
              <p className="text-sm font-bold text-gray-800 leading-tight">{session.name}</p>
              <p className="text-xs font-medium text-blue-600 leading-tight">{session.role}</p>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  )
}
