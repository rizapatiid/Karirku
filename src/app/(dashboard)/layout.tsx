import Link from 'next/link'
import { Users2, LayoutDashboard, ShoppingCart, Package, Users, Settings, FileText, ArrowRightLeft, ShieldCheck, Wallet, ClipboardList } from 'lucide-react'
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

  // ─────────────────────────────────────────────────────────────────────
  // Menu access matrix:
  //  OWNER   : semua fitur
  //  ADMIN   : produk, stok, pembelian, supplier, riwayat, antrian
  //  CASHIER : kasir (POS), transaksi hari ini, pelanggan, antrian
  // ─────────────────────────────────────────────────────────────────────
  const menuGroups: { group: string; items: { href: string; icon: any; label: string; roles: string[] }[] }[] = [
    {
      group: 'Utama',
      items: [
        { href: dashboardHref, icon: LayoutDashboard, label: dashboardLabel, roles: ['OWNER', 'ADMIN', 'CASHIER'] },
      ]
    },
    {
      group: 'Transaksi',
      items: [
        { href: '/kasir',    icon: ShoppingCart,   label: 'Buka POS Kasir',      roles: ['OWNER', 'CASHIER'] },
        { href: '/sales',    icon: FileText,        label: 'Riwayat Penjualan',   roles: ['OWNER', 'ADMIN'] },
        { href: '/sales',    icon: ClipboardList,   label: 'Transaksi Saya',      roles: ['CASHIER'] },
        { href: '/queue',    icon: Users2,          label: 'Antrian Pelanggan',   roles: ['OWNER', 'ADMIN', 'CASHIER'] },
        { href: '/customers',icon: Users,           label: 'Pelanggan',           roles: ['OWNER', 'CASHIER'] },
      ]
    },
    {
      group: 'Inventaris',
      items: [
        { href: '/products',  icon: Package,        label: 'Produk',              roles: ['OWNER', 'ADMIN'] },
        { href: '/stock',     icon: ArrowRightLeft,  label: 'Pergerakan Stok',    roles: ['OWNER', 'ADMIN'] },
        { href: '/purchases', icon: Package,         label: 'Pembelian',          roles: ['OWNER', 'ADMIN'] },
        { href: '/suppliers', icon: Users,           label: 'Supplier',           roles: ['OWNER', 'ADMIN'] },
      ]
    },
    {
      group: 'Keuangan & Laporan',
      items: [
        { href: '/finance',   icon: Wallet,         label: 'Keuangan',           roles: ['OWNER'] },
        { href: '/reports',   icon: FileText,       label: 'Laporan',            roles: ['OWNER'] },
      ]
    },
    {
      group: 'Sistem',
      items: [
        { href: '/audit-logs',icon: ShieldCheck,    label: 'Audit Log',          roles: ['OWNER'] },
        { href: '/users',     icon: Users,          label: 'Pengguna (Role)',     roles: ['OWNER'] },
        { href: '/settings',  icon: Settings,       label: 'Pengaturan Pro',     roles: ['OWNER'] },
      ]
    },
  ]

  // Filter groups and items by role, remove empty groups
  const filteredGroups = menuGroups
    .map(g => ({
      ...g,
      items: g.items.filter(item => item.roles.includes(role))
    }))
    .filter(g => g.items.length > 0)

  // Role badge colors
  const roleBadge: Record<string, string> = {
    OWNER:   'bg-purple-100 text-purple-700',
    ADMIN:   'bg-blue-100 text-blue-700',
    CASHIER: 'bg-green-100 text-green-700',
  }
  const roleLabel: Record<string, string> = {
    OWNER:   'Pemilik',
    ADMIN:   'Admin Gudang',
    CASHIER: 'Kasir',
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-gradient-to-br from-blue-600 to-blue-700">
          <h2 className="text-xl font-black tracking-widest text-white">KASIRKU</h2>
        </div>

        {/* User info card */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate leading-tight">{session.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${roleBadge[role] || 'bg-gray-100 text-gray-600'}`}>
                {roleLabel[role] || role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {filteredGroups.map(group => (
            <div key={group.group}>
              {/* Group label (hidden for Utama) */}
              {group.group !== 'Utama' && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1">
                  {group.group}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all group"
                  >
                    <item.icon size={18} className="shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
          <h1 className="text-base font-bold text-gray-700 tracking-tight">Sistem POS Pro · KASIRKU</h1>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleBadge[role] || 'bg-gray-100 text-gray-600'}`}>
              {roleLabel[role] || role}
            </span>
            <span className="text-sm font-semibold text-gray-700">{session.name}</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  )
}
