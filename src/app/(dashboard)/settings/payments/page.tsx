import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import prisma from '@/lib/prisma'
import { updatePaymentSettings } from '@/actions/settings'

export default async function PaymentSettingsPage() {
  const store = await prisma.store.findFirst()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pengaturan Pembayaran</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola metode pembayaran dan rekening toko</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form action={updatePaymentSettings as any} className="space-y-6">
          <input type="hidden" name="id" value={store?.id || ''} />
          
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 border-b pb-2">Informasi Rekening & QRIS</h4>
            <p className="text-xs text-gray-500 mb-2">Data ini dapat ditampilkan pada struk elektronik (opsional).</p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Detail Rekening Bank (BCA, Mandiri, dll)</label>
              <textarea 
                name="paymentInfo"
                defaultValue={store?.paymentInfo || ''}
                placeholder="Contoh: BCA 1234567890 a.n KASIRKU MART"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" 
              ></textarea>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/settings" className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition">
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
