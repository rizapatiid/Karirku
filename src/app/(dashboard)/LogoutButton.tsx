'use client'

import { logout } from '@/actions/auth'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  return (
    <button 
      onClick={() => logout()} 
      className="flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-bold text-red-600 bg-red-50/70 hover:bg-red-100 border border-red-100 rounded-2xl transition duration-200 group shadow-2xs"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded-lg bg-red-100 text-red-600 group-hover:scale-110 transition-transform">
          <LogOut size={15} />
        </div>
        <span>Keluar Sistem</span>
      </div>
      <span className="text-[10px] bg-red-200/60 px-2 py-0.5 rounded-full text-red-700 font-extrabold group-hover:bg-red-600 group-hover:text-white transition">
        Logout
      </span>
    </button>
  )
}

