import { Store, Receipt, CreditCard, Shield } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pengaturan Sistem</h2>
        <p className="text-gray-500 text-sm mt-1">Konfigurasi profil toko, struk, dan hak akses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/settings/profile" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-blue-300 group">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg h-fit group-hover:bg-blue-600 group-hover:text-white transition"><Store size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">Profil Toko</h3>
            <p className="text-sm text-gray-500">Atur nama toko, alamat, logo, dan informasi kontak untuk ditampilkan di struk.</p>
          </div>
        </Link>

        <Link href="/settings/receipt" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-purple-300 group">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg h-fit group-hover:bg-purple-600 group-hover:text-white transition"><Receipt size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition">Pengaturan Struk</h3>
            <p className="text-sm text-gray-500">Sesuaikan ukuran kertas printer (58mm/80mm), catatan kaki, dan teks promo.</p>
          </div>
        </Link>

        <Link href="/settings/payments" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-green-300 group">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg h-fit group-hover:bg-green-600 group-hover:text-white transition"><CreditCard size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition">Metode Pembayaran</h3>
            <p className="text-sm text-gray-500">Kelola opsi pembayaran (Tunai, QRIS, Transfer Bank, e-Wallet).</p>
          </div>
        </Link>

        <Link href="/users" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-red-300 group">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg h-fit group-hover:bg-red-600 group-hover:text-white transition"><Shield size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-red-600 transition">Manajemen Pengguna (Role)</h3>
            <p className="text-sm text-gray-500">Tambah akun kasir, admin, atau owner serta atur hak akses (permission).</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
