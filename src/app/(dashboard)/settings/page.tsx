import { Store, Receipt, CreditCard, Shield, Percent, DatabaseBackup, Clock } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Pengaturan Sistem Pro</h2>
        <p className="text-gray-500 text-sm mt-1">Manajemen konfigurasi tingkat lanjut untuk retail Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/settings/profile" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-blue-300 group">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg h-fit group-hover:bg-blue-600 group-hover:text-white transition"><Store size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">Profil Toko</h3>
            <p className="text-sm text-gray-500">Atur nama toko, alamat, logo, dan info kontak pada struk.</p>
          </div>
        </Link>

        <Link href="/settings/tax" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-indigo-300 group">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg h-fit group-hover:bg-indigo-600 group-hover:text-white transition"><Percent size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition">Pajak & Biaya (Tax)</h3>
            <p className="text-sm text-gray-500">Konfigurasi persentase PPN (cth: 11%) dan biaya layanan otomatis.</p>
          </div>
        </Link>

        <Link href="/settings/receipt" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-purple-300 group">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg h-fit group-hover:bg-purple-600 group-hover:text-white transition"><Receipt size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition">Pengaturan Printer & Struk</h3>
            <p className="text-sm text-gray-500">Kertas (58mm/80mm), koneksi printer Bluetooth/LAN, teks footer.</p>
          </div>
        </Link>

        <Link href="/settings/payments" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-green-300 group">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg h-fit group-hover:bg-green-600 group-hover:text-white transition"><CreditCard size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-600 transition">Metode Pembayaran</h3>
            <p className="text-sm text-gray-500">Daftar rekening Bank transfer, integrasi QRIS Dinamis & e-Wallet.</p>
          </div>
        </Link>

        <Link href="/users" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-red-300 group">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg h-fit group-hover:bg-red-600 group-hover:text-white transition"><Shield size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-red-600 transition">Hak Akses & Otorisasi</h3>
            <p className="text-sm text-gray-500">Manajemen PIN Kasir, kontrol admin, log aktivitas (Audit Trail).</p>
          </div>
        </Link>

        <Link href="/settings/shifts" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-amber-300 group">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg h-fit group-hover:bg-amber-600 group-hover:text-white transition"><Clock size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition">Jam Kerja Shift</h3>
            <p className="text-sm text-gray-500">Atur master jadwal jam operasional shift 1, shift 2, dan shift malam.</p>
          </div>
        </Link>

        <Link href="/settings/database" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-4 hover:shadow-md transition cursor-pointer hover:border-yellow-300 group">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg h-fit group-hover:bg-yellow-600 group-hover:text-white transition"><DatabaseBackup size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-yellow-600 transition">Impor/Ekspor Data</h3>
            <p className="text-sm text-gray-500">Backup database harian, import produk massal via file Excel/CSV.</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
