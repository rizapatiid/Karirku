'use client'

import { useState } from 'react'
import { login } from '@/actions/auth'

export default function LoginClient() {
  const [standardUsername, setStandardUsername] = useState('')
  const [standardPassword, setStandardPassword] = useState('')
  const [standardLoading, setStandardLoading] = useState(false)
  const [mainError, setMainError] = useState<string | null>(null)

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMainError(null)
    setStandardLoading(true)
    const formData = new FormData()
    formData.append('username', standardUsername)
    formData.append('password', standardPassword)
    const result = await login(formData)
    if (result?.error) {
      setMainError(result.error)
      setStandardLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Simple Main Login Box */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-200/80">
        
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black shadow-md">
            K
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">KASIRKU POS</h1>
          <p className="text-gray-500 mt-0.5 text-xs">Masuk ke sistem operasional POS</p>
        </div>

        {mainError && (
          <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 text-center">
            {mainError}
          </div>
        )}

        {/* Form Standard Login */}
        <form onSubmit={handleStandardSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={standardUsername}
              onChange={(e) => setStandardUsername(e.target.value)}
              required
              placeholder="Masukkan username Anda..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={standardPassword}
              onChange={(e) => setStandardPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={standardLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold py-3 rounded-xl transition duration-200 shadow-sm cursor-pointer text-xs"
          >
            {standardLoading ? 'Memproses Login...' : 'Masuk Sistem'}
          </button>
        </form>

        {/* Footer Demo Info */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
          <p className="font-semibold text-gray-500">Demo User:</p>
          <p className="font-mono mt-0.5">kasir / owner / admin (Pass: password123)</p>
        </div>
      </div>
    </div>
  )
}
