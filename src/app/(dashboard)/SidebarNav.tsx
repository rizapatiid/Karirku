'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  href: string
  icon: any
  label: string
}

interface Group {
  group: string
  items: MenuItem[]
}

export default function SidebarNav({ groups }: { groups: Group[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
      {groups.map(group => (
        <div key={group.group}>
          {group.group !== 'Utama' && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-1.5">
              {group.group}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map(item => {
              const isActive = pathname === item.href || (item.href !== '/owner' && item.href !== '/admin' && item.href !== '/kasir' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium text-sm group ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Icon size={18} className={`shrink-0 transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-110'}`} />
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
