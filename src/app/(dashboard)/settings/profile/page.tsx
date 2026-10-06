import prisma from '@/lib/prisma'
import { updateStoreProfile } from '@/actions/settings'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function StoreProfilePage() {
  const store = await prisma.store.findFirst()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Profil Toko</h2>
          <p className="text-gray-500 text-sm mt-1">Data ini akan ditampilkan pada kop struk transaksi</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form action={updateStoreProfile as any} className="space-y-6">
          <input type="hidden" name="id" value={store?.id || ''} />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nama Toko <span className="text-red-500">*</span></label>
            <input 
              name="name" 
              required 
              defaultValue={store?.name || ''}
              placeholder="Contoh: KASIRKU Mart"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nomor Telepon / WhatsApp</label>
            <input 
              name="phone" 
              defaultValue={store?.phone || ''}
              placeholder="08123456789"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Alamat Lengkap</label>
            <textarea 
              name="address" 
              defaultValue={store?.address || ''}
              placeholder="Alamat lengkap toko..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" 
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/settings" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition">
              Simpan Profil Toko
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

