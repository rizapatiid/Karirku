'use client'

import { logout } from '@/actions/auth'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  return (
    <button 
      onClick={() => logout()} 
      className="flex w-full items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
    >
      <LogOut size={20} />
      <span className="font-medium">Logout</span>
    </button>
  )
}
