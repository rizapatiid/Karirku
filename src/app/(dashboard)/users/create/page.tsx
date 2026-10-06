import { createUser } from '@/actions/user'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CreateUserPage() {
  const roles = await prisma.role.findMany()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tambah Pengguna Baru</h2>
          <p className="text-gray-500 text-sm mt-1">Buat akun untuk kasir atau admin baru</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form action={createUser as any} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nama Lengkap <span className="text-red-500">*</span></label>
            <input 
              name="name" 
              required 
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username <span className="text-red-500">*</span></label>
              <input 
                name="username" 
                required
                placeholder="budi_kasir"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
              <input 
                name="password" 
                type="password"
                required
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Hak Akses (Role) <span className="text-red-500">*</span></label>
            <select name="roleId" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">-- Pilih Hak Akses --</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Role menentukan fitur apa saja yang bisa diakses oleh pengguna ini.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/users" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition">
              Simpan Akun
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

