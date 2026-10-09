'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users2, LayoutDashboard, ShoppingCart, Package, Users, Settings, FileText, ArrowRightLeft, ShieldCheck, Wallet, ClipboardList, HelpCircle, ChevronRight } from 'lucide-react'

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
    <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin">
      {groups.map(group => (
        <div key={group.group}>
          {group.group !== 'Utama' && (
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 mb-1.5">
              {group.group}
            </p>
          )}
          <div className="space-y-1">
            {group.items.map(item => {
              const isActive = pathname === item.href || (item.href !== '/owner' && item.href !== '/admin' && item.href !== '/kasir' && pathname.startsWith(item.href))
              const Icon = ICON_MAP[item.iconName] || HelpCircle

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-200 group border text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold shadow-md shadow-blue-500/20 border-blue-600'
                      : 'bg-white text-gray-700 border-gray-100 hover:bg-blue-50/70 hover:text-blue-600 hover:border-blue-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-xl transition-transform ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 group-hover:scale-110'}`}>
                      <Icon size={18} />
                    </div>
                    <span className="truncate leading-tight font-bold">{item.label}</span>
                  </div>
                  {isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}


