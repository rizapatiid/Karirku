'use client'

import { Printer, ArrowLeft, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PrintButtonProps {
  invoiceNumber: string
  totalFormatted: string
}

export default function PrintButton({ invoiceNumber, totalFormatted }: PrintButtonProps) {
  const router = useRouter()

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Terima kasih telah berbelanja!\n\nNo. Invoice: ${invoiceNumber}\nTotal: ${totalFormatted}\n\nStruk transaksi Anda tersimpan di sistem kasir.`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="no-print mt-6 flex flex-col gap-2.5 w-full max-w-[340px]">
      <button 
        onClick={() => window.print()}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 px-4 rounded-xl text-xs font-extrabold transition shadow-md cursor-pointer"
      >
        <Printer size={16} /> Cetak Struk
      </button>
      
      <button 
        onClick={handleShareWhatsApp}
        className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
      >
        <Send size={15} /> Kirim Struk via WhatsApp
      </button>
      
      <div className="grid grid-cols-2 gap-2 mt-1">
        <button 
          onClick={() => router.push('/kasir')}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Ke Kasir
        </button>
        <button 
          onClick={() => router.push('/sales')}
          className="w-full flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Riwayat Sales
        </button>
      </div>
    </div>
  )
}
