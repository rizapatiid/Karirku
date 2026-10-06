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
        <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-4">
          <h1 className="text-xl font-bold uppercase tracking-widest text-black">{store?.name || 'KASIRKU'}</h1>
          <p className="text-xs text-gray-500 mt-1">{store?.address || 'Alamat Toko Belum Diatur'}</p>
          <p className="text-xs text-gray-500">Telp: {store?.phone || '-'}</p>
        </div>

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

        {/* Item List */}
        <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-3">
          {sale.items.map((item) => (
            <div key={item.id} className="text-sm text-black">
              <div className="font-medium">{item.product.name}</div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{item.quantity} x {formatRupiah(Number(item.unitPrice))}</span>
                <span>{formatRupiah(Number(item.subtotal))}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="text-sm space-y-1 mb-4">
          <div className="flex justify-between font-bold text-black">
            <span>Total:</span>
            <span>{formatRupiah(Number(sale.total))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tunai:</span>
            <span>{formatRupiah(Number(sale.paidAmount))}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Kembali:</span>
            <span>{formatRupiah(Number(sale.changeAmount))}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
          <p className="text-xs font-bold text-black">TERIMA KASIH</p>
          <p className="text-[10px] text-gray-500 mt-1">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
        </div>

        <PrintButton />
      </div>
    </div>
  )
}
