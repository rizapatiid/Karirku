import prisma from '@/lib/prisma'
import { getSession } from '@/actions/auth'
import LogoutButton from './LogoutButton'
import SidebarNav from './SidebarNav'
import { redirect } from 'next/navigation'
import { Store as StoreIcon, Monitor } from 'lucide-react'

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
        { href: '/shifts',   iconName: 'Clock',           label: 'Shift & Rekap Kasir', roles: ['OWNER', 'ADMIN', 'KASIR'] },
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
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200/80 flex flex-col shadow-xs z-20">
        {/* Header Branding */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-200/80 bg-white">
          {store?.logoUrl ? (
            <img src={store.logoUrl} alt="Logo" className="w-9 h-9 object-contain bg-blue-50 rounded-2xl p-1 border border-blue-100 shadow-2xs" />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-sm">
              <StoreIcon size={18} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-black text-gray-900 tracking-tight leading-tight truncate uppercase">{store?.name || 'KASIRKU'}</h2>
            <p className="text-[10px] text-blue-600 font-bold tracking-wide">Enterprise POS System</p>
          </div>
        </div>

        {/* Client Navigation */}
        <SidebarNav groups={filteredGroups} />

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-gray-200/80 bg-gray-50/60 space-y-2">
          <div className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-gray-200/70 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate leading-tight">{session.name}</p>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border inline-block mt-0.5 ${roleBadge[role] || 'bg-gray-100 text-gray-600'}`}>
                {roleLabel[role] || role}
              </span>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Header */}
        <header className="h-14 bg-white border-b border-gray-200/80 flex items-center justify-between px-6 shadow-2xs z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/queue/display"
              target="_blank"
              className="flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-extrabold rounded-xl border border-purple-200 transition shadow-2xs group"
            >
              <Monitor size={15} className="text-purple-600 group-hover:scale-110 transition-transform shrink-0" />
              <span>Layar TV Antrian</span>
            </a>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-gray-50/80">
          {children}
        </div>
      </main>
    </div>
  )
}
