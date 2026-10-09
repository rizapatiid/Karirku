import prisma from '@/lib/prisma'
import { getSession } from '@/actions/auth'
import LogoutButton from './LogoutButton'
import SidebarNav from './SidebarNav'
import { redirect } from 'next/navigation'
import { Store as StoreIcon } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const store = await prisma.store.findFirst()

  const role = session.role || 'KASIR'

  const dashboardHref = role === 'OWNER' ? '/owner' : (role === 'ADMIN' ? '/admin' : '/kasir')
  const dashboardLabel = role === 'OWNER' ? 'Dasbor Pemilik' : (role === 'ADMIN' ? 'Dasbor Gudang' : 'Mesin Kasir')

  const menuGroups = [
    {
      group: 'Utama',
      items: [
        { href: dashboardHref, iconName: 'LayoutDashboard', label: dashboardLabel, roles: ['OWNER', 'ADMIN', 'KASIR'] },
      ]
    },
    {
      group: 'Transaksi',
      items: [
        { href: '/sales',    iconName: 'FileText',        label: 'Riwayat Penjualan',   roles: ['OWNER', 'ADMIN'] },
        { href: '/sales',    iconName: 'ClipboardList',   label: 'Transaksi Saya',      roles: ['KASIR'] },
        { href: '/queue',    iconName: 'Users2',          label: 'Antrian Pelanggan',   roles: ['OWNER', 'ADMIN', 'KASIR'] },
        { href: '/customers',iconName: 'Users',           label: 'Pelanggan',           roles: ['OWNER', 'KASIR'] },
      ]
    },
    {
      group: 'Inventaris',
      items: [
        { href: '/products',  iconName: 'Package',        label: 'Produk',              roles: ['OWNER', 'ADMIN'] },
        { href: '/stock',     iconName: 'ArrowRightLeft',  label: 'Pergerakan Stok',    roles: ['OWNER', 'ADMIN'] },
        { href: '/purchases', iconName: 'Package',         label: 'Pembelian',          roles: ['OWNER', 'ADMIN'] },
        { href: '/suppliers', iconName: 'Users',           label: 'Supplier',           roles: ['OWNER', 'ADMIN'] },
      ]
    },
    {
      group: 'Keuangan & Laporan',
      items: [
        { href: '/finance',   iconName: 'Wallet',         label: 'Keuangan',           roles: ['OWNER'] },
        { href: '/reports',   iconName: 'FileText',       label: 'Laporan',            roles: ['OWNER'] },
      ]
    },
    {
      group: 'Sistem',
      items: [
        { href: '/audit-logs',iconName: 'ShieldCheck',    label: 'Audit Log',          roles: ['OWNER'] },
        { href: '/users',     iconName: 'Users',          label: 'Pengguna (Role)',     roles: ['OWNER'] },
        { href: '/settings',  iconName: 'Settings',       label: 'Pengaturan Pro',     roles: ['OWNER'] },
      ]
    },
  ]

  const filteredGroups = menuGroups
    .map(g => ({
      ...g,
      items: g.items.filter(item => item.roles.includes(role))
    }))
    .filter(g => g.items.length > 0)

  const roleBadge: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-700 border-purple-200',
    ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
    KASIR: 'bg-green-100 text-green-700 border-green-200',
  }
  const roleLabel: Record<string, string> = {
    OWNER: 'Pemilik',
    ADMIN: 'Admin Gudang',
    KASIR: 'Kasir',
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header Branding */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-sm">
          {store?.logoUrl ? (
            <img src={store.logoUrl} alt="Logo" className="w-9 h-9 object-contain bg-white rounded-xl p-0.5 shadow-sm" />
          ) : (
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white">
              <StoreIcon size={20} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-wider leading-tight truncate uppercase">{store?.name || 'KASIRKU'}</h2>
            <p className="text-[10px] text-blue-100 font-medium tracking-wide">Enterprise POS Pro</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate leading-tight">{session.name}</p>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border inline-block mt-0.5 ${roleBadge[role] || 'bg-gray-100 text-gray-600'}`}>
                {roleLabel[role] || role}
              </span>
            </div>
          </div>
        </div>

        {/* Client Navigation */}
        <SidebarNav groups={filteredGroups} />

        {/* Logout */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800 tracking-tight">{store?.name || 'KASIRKU'}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500 font-medium">Sistem POS Profesional</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${roleBadge[role] || 'bg-gray-100 text-gray-600'}`}>
              {roleLabel[role] || role}
            </span>
            <span className="text-xs font-bold text-gray-700">{session.name}</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  )
}
