'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users2, LayoutDashboard, ShoppingCart, Package, Users, Settings, FileText, ArrowRightLeft, ShieldCheck, Wallet, ClipboardList, HelpCircle } from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  ClipboardList,
  Users2,
  Users,
  Package,
  ArrowRightLeft,
  Wallet,
  ShieldCheck,
  Settings,
}

interface MenuItem {
  href: string
  iconName: string
  label: string
}

interface Group {
  group: string
  items: MenuItem[]
}

export default function SidebarNav({ groups }: { groups: Group[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
      {groups.map(group => (
        <div key={group.group}>
          {group.group !== 'Utama' && (
            <p className="text-[11px] font-semibold text-slate-400 px-3 mb-1.5 uppercase tracking-wider">
              {group.group}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map(item => {
              const isActive = pathname === item.href || (item.href !== '/owner' && item.href !== '/admin' && item.href !== '/kasir' && pathname.startsWith(item.href))
              const Icon = ICON_MAP[item.iconName] || HelpCircle

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}



