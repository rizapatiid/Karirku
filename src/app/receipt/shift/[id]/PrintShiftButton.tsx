'use client'

import { Printer, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrintShiftButton() {
  const router = useRouter()

  return (
    <div className="no-print mt-5 flex flex-col gap-2 w-full max-w-[310px]">
      <button 
        onClick={() => window.print()}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-bold py-3 rounded-xl shadow-md transition cursor-pointer"
      >
        <Printer size={16} /> Cetak Struk Shift
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => router.push('/kasir')}
          className="w-full flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Ke Kasir
        </button>
        <button 
          onClick={() => router.push('/shifts')}
          className="w-full flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
        >
          Riwayat Shift
        </button>
      </div>
    </div>
  )
}
