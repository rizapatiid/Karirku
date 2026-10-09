'use client'

import { logout } from '@/actions/auth'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  return (
    <button 
      onClick={() => logout()} 
      className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <LogOut size={18} className="shrink-0 text-slate-400" />
      <span>Keluar / Logout</span>
    </button>
  )
}


