import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PrintButton from './PrintButton'

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const [sale, store] = await Promise.all([
    prisma.sale.findUnique({
      where: { id: resolvedParams.id },
      include: {
        items: { include: { product: true } },
        user: true,
        customer: true,
        Payment: true
      }
    }),
    prisma.store.findFirst()
  ])

  if (!sale) redirect('/sales')

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)
  const paperSize = store?.receiptPaperSize || '58mm'
  const is80mm = paperSize === '80mm'
  const paymentMethodName = sale.Payment?.[0]?.method || 'CASH'

  return (
    <div className="min-h-screen bg-gray-100/80 flex flex-col items-center justify-center p-4 print:p-0 print:bg-white print:min-h-0">
      <style>{`
        @page {
          size: ${is80mm ? '80mm auto' : '58mm auto'};
          margin: 0mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-box {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 4mm !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Main Receipt Thermal Card */}
      <div className={`receipt-box bg-white p-5 rounded-2xl shadow-xl border border-gray-200/90 text-gray-900 font-sans text-xs ${
        is80mm ? 'w-full max-w-[360px]' : 'w-full max-w-[310px]'
      }`}>
        {/* Store Header */}
        <div className="text-center mb-3 pb-3 border-b border-dashed border-gray-300 flex flex-col items-center">
          {store?.logoUrl && (
            <img src={store.logoUrl} alt="Logo" className="max-w-[70px] max-h-[70px] object-contain mb-2 grayscale" />
          )}
          <h1 className="text-base font-black uppercase tracking-wider text-black leading-tight">{store?.name || 'KASIRKU POS'}</h1>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{store?.address || 'Jl. Utama No. 123, Indonesia'}</p>
          {store?.phone && <p className="text-[11px] text-gray-500">Telp: {store.phone}</p>}
        </div>

        {/* Queue Number Badge */}
        {sale.queueNumber && (
          <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3 bg-gray-50/80 -mx-5 px-5 py-2.5">
            <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">NOMOR ANTREAN</p>
            <p className="text-3xl font-black text-black tracking-tight font-mono mt-0.5">
              #{String(sale.queueNumber).padStart(3, '0')}
            </p>
          </div>
        )}

        {/* Transaction Metadata */}
        <div className="text-[11px] text-gray-600 mb-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">No. Invoice:</span>
            <span className="font-mono font-bold text-gray-900">{sale.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tanggal:</span>
            <span className="font-medium text-gray-800">{new Date(sale.transactionDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Kasir:</span>
            <span className="font-medium text-gray-800">{sale.user?.name || 'Kasir'}</span>
          </div>
          {sale.customer && (
            <div className="flex justify-between">
              <span className="text-gray-400">Pelanggan:</span>
              <span className="font-bold text-gray-900">{sale.customer.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Metode Bayar:</span>
            <span className="font-bold text-blue-600 uppercase">{paymentMethodName}</span>
          </div>
        </div>

        {/* Purchased Items List */}
        <div className="border-t border-b border-dashed border-gray-300 py-2.5 mb-3 space-y-2">
          {sale.items.map(item => (
            <div key={item.id} className="text-[11px]">
              <div className="font-bold text-gray-900">{item.product?.name || 'Produk'}</div>
              <div className="flex justify-between text-gray-500 mt-0.5">
                <span>{item.quantity} x {formatRupiah(Number(item.unitPrice))}</span>
                <span className="font-bold text-gray-900">{formatRupiah(Number(item.subtotal))}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Calculation Summary */}
        <div className="space-y-1 text-[11px] mb-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-800">{formatRupiah(Number(sale.total) - Number(sale.tax) + Number(sale.discount))}</span>
          </div>
          {Number(sale.tax) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Pajak & Layanan</span>
              <span className="font-medium text-gray-800">{formatRupiah(Number(sale.tax))}</span>
            </div>
          )}
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Diskon</span>
              <span>-{formatRupiah(Number(sale.discount))}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center font-black text-black pt-2 border-t border-gray-300 mt-2 text-sm">
            <span>TOTAL TAGIHAN</span>
            <span className="text-base font-extrabold">{formatRupiah(Number(sale.total))}</span>
          </div>

          <div className="flex justify-between text-gray-600 pt-1.5">
            <span>Bayar ({paymentMethodName})</span>
            <span className="font-bold text-gray-900">{formatRupiah(Number(sale.paidAmount))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Kembali</span>
            <span className="font-bold text-gray-900">{formatRupiah(Number(sale.changeAmount))}</span>
          </div>
        </div>

        {/* Payment Account Information */}
        {store?.paymentInfo && (
          <div className="text-center text-[10px] text-gray-500 border-t border-dashed border-gray-300 pt-3 mb-3">
            <span className="font-bold text-gray-800 block mb-0.5">Informasi Pembayaran:</span>
            <pre className="whitespace-pre-wrap font-sans leading-tight text-gray-600">{store.paymentInfo}</pre>
          </div>
        )}

        {/* Receipt Footer Message */}
        <div className="text-center mt-3 pt-3 border-t border-dashed border-gray-300 space-y-1">
          <p className="text-xs font-black text-gray-900 tracking-wider">TERIMA KASIH</p>
          <p className="text-[10px] text-gray-500 leading-snug">
            {store?.receiptFooter || "Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan."}
          </p>
          {store?.receiptPromo && (
            <div className="mt-2 inline-block border border-gray-900 border-dashed py-1 px-2.5 rounded">
              <span className="font-bold text-black text-[9px] uppercase tracking-wide">{store.receiptPromo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Screen action buttons (hidden in print) */}
      <PrintButton invoiceNumber={sale.invoiceNumber} totalFormatted={formatRupiah(Number(sale.total))} />
    </div>
  )
}
