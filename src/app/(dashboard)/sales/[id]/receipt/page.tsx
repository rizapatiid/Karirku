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
        customer: true
      }
    }),
    prisma.store.findFirst()
  ])

  if (!sale) redirect('/sales')

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 print:bg-white print:py-0">
      <div className="bg-white p-6 w-full max-w-sm shadow-lg print:shadow-none print:w-full print:max-w-full">
        {/* Header Struk */}
        <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4 flex flex-col items-center">
          {store?.logoUrl && (
            <img src={store.logoUrl} alt="Logo" className="max-w-[80px] max-h-[80px] object-contain mb-3 grayscale print:grayscale" />
          )}
          <h1 className="text-xl font-bold uppercase tracking-widest text-black leading-tight">{store?.name || 'KASIRKU'}</h1>
          <p className="text-xs text-gray-500 mt-1">{store?.address || 'Alamat Toko Belum Diatur'}</p>
          <p className="text-xs text-gray-500">Telp: {store?.phone || '-'}</p>
        </div>

        {/* Nomor Antrean (Large & Prominent) */}
        {sale.queueNumber && (
          <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-4">
            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">NOMOR ANTREAN</p>
            <p className="text-4xl font-black text-black tracking-tight mt-0.5">
              {String(sale.queueNumber).padStart(3, '0')}
            </p>
          </div>
        )}

        {/* Info Transaksi */}
        <div className="text-xs text-gray-700 mb-4 space-y-1">
          <div className="flex justify-between">
            <span>No:</span>
            <span className="font-mono">{sale.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Tgl:</span>
            <span>{sale.transactionDate.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span>{sale.user.name}</span>
          </div>
          {sale.customer && (
            <div className="flex justify-between">
              <span>Plg:</span>
              <span>{sale.customer.name}</span>
            </div>
          )}
        </div>

        {/* Item Transaksi */}
        <div className="border-t border-b border-dashed border-gray-300 py-4 mb-4">
          {sale.items.map(item => (
            <div key={item.id} className="mb-2 last:mb-0">
              <div className="text-xs font-bold text-gray-800">{item.product.name}</div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{item.quantity} x {formatRupiah(Number(item.unitPrice))}</span>
                <span>{formatRupiah(Number(item.subtotal))}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="space-y-1 mb-6 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatRupiah(Number(sale.total) - Number(sale.tax) + Number(sale.discount))}</span>
          </div>
          {Number(sale.tax) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Pajak & Layanan</span>
              <span>{formatRupiah(Number(sale.tax))}</span>
            </div>
          )}
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Diskon</span>
              <span>-{formatRupiah(Number(sale.discount))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-black pt-2 border-t border-gray-200 mt-2 text-base">
            <span>TOTAL</span>
            <span>{formatRupiah(Number(sale.total))}</span>
          </div>
          <div className="flex justify-between text-gray-600 pt-2">
            <span>Tunai</span>
            <span>{formatRupiah(Number(sale.paidAmount))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Kembali</span>
            <span>{formatRupiah(Number(sale.changeAmount))}</span>
          </div>
        </div>

        {/* Payment Info */}
        {store?.paymentInfo && (
          <div className="text-center text-xs text-gray-600 border-t border-dashed border-gray-300 pt-4 mb-4">
            <span className="font-bold text-black block mb-1">Informasi Pembayaran (Transfer/QRIS):</span>
            <pre className="whitespace-pre-wrap font-sans">{store.paymentInfo}</pre>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
          <p className="text-xs font-bold text-black">TERIMA KASIH</p>
          <p className="text-[10px] text-gray-500 mt-1">
            {store?.receiptFooter || "Barang yang sudah dibeli tidak dapat ditukar/dikembalikan."}
          </p>
          {store?.receiptPromo && (
            <div className="mt-3 inline-block border border-black border-dashed p-1.5 px-3">
              <span className="font-bold text-black text-[10px] uppercase leading-none">{store.receiptPromo}</span>
            </div>
          )}
        </div>

        <PrintButton />
      </div>
    </div>
  )
}
