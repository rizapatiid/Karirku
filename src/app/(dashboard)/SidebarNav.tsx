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
    <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin">
      {groups.map(group => (
        <div key={group.group}>
          {group.group !== 'Utama' && (
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 mb-2">
              {group.group}
            </p>
          )}
          <div className="flex flex-col space-y-2.5">
            {group.items.map(item => {
              const isActive = pathname === item.href || (item.href !== '/owner' && item.href !== '/admin' && item.href !== '/kasir' && pathname.startsWith(item.href))
              const Icon = ICON_MAP[item.iconName] || HelpCircle

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center text-center p-3.5 rounded-2xl transition-all duration-200 group border ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md border-blue-600 scale-[1.01]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl transition-transform ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 group-hover:scale-110'}`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-xs font-extrabold mt-2 leading-tight px-1">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

