'use client'

import { Printer, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrintButton() {
  const router = useRouter()

  return (
    <div className="mt-8 flex flex-col gap-3 print:hidden">
      <button 
        onClick={() => window.print()}
        className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition"
      >
        <Printer size={18} /> Cetak Struk
      </button>
      <button 
        onClick={() => {
          const text = encodeURIComponent(`Terima kasih telah berbelanja di KASIRKU! Invoice Anda dapat dilihat pada struk yang kami lampirkan.`)
          window.open(`https://wa.me/?text=${text}`, '_blank')
        }}
        className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-lg font-bold border border-green-200 hover:bg-green-100 transition"
      >
        Kirim ke WhatsApp
      </button>
      <button 
        onClick={() => router.push('/sales')}
        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition"
      >
        <ArrowLeft size={18} /> Kembali ke Penjualan
      </button>
    </div>
  )
}
