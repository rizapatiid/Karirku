import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function ShiftReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params

  const [shift, store] = await Promise.all([
    prisma.shift.findUnique({
      where: { id: resolvedParams.id },
      include: {
        user: true,
        sales: {
          include: { Payment: true }
        }
      }
    }),
    prisma.store.findFirst()
  ])

  if (!shift) redirect('/shifts')

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  const is80mm = store?.receiptPaperSize === '80mm'

  const startCash = Number(shift.startCash)
  const expectedCash = Number(shift.expectedCash || 0)
  const actualCash = Number(shift.actualCash || 0)
  const difference = Number(shift.difference || 0)
  const totalSales = Number(shift.totalSales || 0)
  const cashSales = Number(shift.cashSales || 0)
  const nonCashSales = Number(shift.nonCashSales || 0)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 print:p-0 print:bg-white">
      <style>{`
        @page {
          size: ${is80mm ? '80mm auto' : '58mm auto'};
          margin: 0mm;
        }
        @media print {
          html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .receipt-box { box-shadow: none !important; border: none !important; padding: 4mm !important; width: 100% !important; }
        }
      `}</style>

      <div className={`receipt-box bg-white p-5 rounded-2xl shadow-xl border border-gray-200 text-gray-900 font-sans text-xs ${
        is80mm ? 'w-full max-w-[360px]' : 'w-full max-w-[310px]'
      }`}>
        <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-300">
          <h1 className="text-base font-black uppercase tracking-wider text-black">{store?.name || 'KASIRKU POS'}</h1>
          <p className="text-xs font-bold text-blue-600 uppercase mt-0.5">REKAP SHIFT KASIR</p>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{shift.shiftNumber}</p>
        </div>

        <div className="text-[11px] text-gray-600 mb-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Kasir:</span>
            <span className="font-bold text-gray-900">{shift.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Jam Buka:</span>
            <span>{new Date(shift.startTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Jam Tutup:</span>
            <span>{shift.endTime ? new Date(shift.endTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Masih Aktif'}</span>
          </div>
        </div>

        <div className="border-t border-b border-dashed border-gray-300 py-3 mb-3 space-y-1.5 text-[11px]">
          <div className="flex justify-between font-medium">
            <span>Modal Awal Laci</span>
            <span className="font-bold text-gray-900">{formatRupiah(startCash)}</span>
          </div>
          <div className="flex justify-between font-medium text-emerald-700">
            <span>+ Penjualan Tunai</span>
            <span className="font-bold">{formatRupiah(cashSales)}</span>
          </div>
          <div className="flex justify-between font-medium text-blue-700">
            <span>+ Penjualan Non-Tunai</span>
            <span className="font-bold">{formatRupiah(nonCashSales)}</span>
          </div>
          <div className="flex justify-between font-black text-black pt-1.5 border-t border-gray-200 text-xs">
            <span>TOTAL OMSET SHIFT</span>
            <span>{formatRupiah(totalSales)}</span>
          </div>
        </div>

        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 mb-3 space-y-1 text-[11px]">
          <div className="flex justify-between text-gray-600">
            <span>Total Tunai Seharusnya:</span>
            <span className="font-bold text-gray-900">{formatRupiah(expectedCash)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Uang Fisik di Laci:</span>
            <span className="font-bold text-gray-900">{formatRupiah(actualCash)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-200 font-bold">
            <span>Selisih Kas:</span>
            <span className={difference === 0 ? 'text-emerald-600 font-black' : difference > 0 ? 'text-blue-600 font-black' : 'text-red-600 font-black'}>
              {difference === 0 ? 'Pas (Rp 0)' : `${difference > 0 ? '+' : ''}${formatRupiah(difference)}`}
            </span>
          </div>
        </div>

        {shift.notes && (
          <div className="text-[10px] text-gray-500 mb-3 italic bg-yellow-50 p-2 rounded border border-yellow-200">
            Catatan: {shift.notes}
          </div>
        )}

        <div className="text-center pt-2 border-t border-dashed border-gray-300 text-[10px] text-gray-400">
          Printed by KASIRKU POS · {new Date().toLocaleString('id-ID')}
        </div>
      </div>

      <div className="no-print mt-4 flex gap-2 w-full max-w-[310px]">
        <button onClick={() => window.print()} className="w-full bg-gray-900 text-white text-xs font-bold py-2.5 rounded-xl">
          Cetak Struk Shift
        </button>
      </div>
    </div>
  )
}
