import prisma from '@/lib/prisma'
import { updateStoreProfile } from '@/actions/settings'
import Link from 'next/link'
import { ArrowLeft, Upload, Store } from 'lucide-react'
import Image from 'next/image'

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
          <input type="hidden" name="existingLogoUrl" value={store?.logoUrl || ''} />
          
          <div className="space-y-4 border-b pb-6">
            <label className="text-sm font-medium text-gray-700 block">Logo Toko</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                {store?.logoUrl ? (
                  <Image src={store.logoUrl} alt="Logo" width={96} height={96} className="object-contain w-full h-full" />
                ) : (
                  <Store size={32} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input 
                  type="file" 
                  name="logo" 
                  accept="image/png, image/jpeg, image/jpg"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none"
                />
                <p className="text-xs text-gray-500">Format yang didukung: JPG, PNG. Ukuran maksimal 2MB.</p>
              </div>
            </div>
          </div>

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
