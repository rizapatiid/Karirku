'use client'

import { useState } from 'react'
import { processSaleReturn } from '@/actions/returns'
import { useRouter } from 'next/navigation'

type SaleItem = {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export default function ReturnClient({ sale }: { sale: { id: string, invoiceNumber: string, items: SaleItem[] } }) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // State for tracking returns: index mapped to { returnQty, condition }
  const [returnItems, setReturnItems] = useState(
    sale.items.map(i => ({ productId: i.productId, returnQty: 0, condition: 'GOOD' as 'GOOD' | 'DAMAGED' }))
  )

  const handleQtyChange = (index: number, val: number) => {
    const maxQty = sale.items[index].quantity
    const safeVal = Math.max(0, Math.min(val, maxQty))
    
    const newItems = [...returnItems]
    newItems[index].returnQty = safeVal
    setReturnItems(newItems)
  }

  const handleConditionChange = (index: number, condition: 'GOOD' | 'DAMAGED') => {
    const newItems = [...returnItems]
    newItems[index].condition = condition
    setReturnItems(newItems)
  }

  const totalRefund = returnItems.reduce((acc, item, index) => {
    return acc + (item.returnQty * sale.items[index].unitPrice)
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (totalRefund <= 0) {
      alert('Pilih setidaknya 1 barang untuk diretur.')
      return
    }

    if (!reason) {
      alert('Mohon isi alasan retur.')
      return
    }

    setIsLoading(true)
    const payload = {
      saleId: sale.id,
      reason,
      items: returnItems
        .filter(i => i.returnQty > 0)
        .map(i => ({ productId: i.productId, quantity: i.returnQty, condition: i.condition }))
    }

    const res = await processSaleReturn(payload)
    if (res?.success === false) {
      alert(res.error)
      setIsLoading(false)
    }
  }

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Produk</th>
              <th className="px-4 py-3 font-semibold text-center">Qty Beli</th>
              <th className="px-4 py-3 font-semibold text-center">Qty Retur</th>
              <th className="px-4 py-3 font-semibold text-center">Kondisi Barang</th>
              <th className="px-4 py-3 font-semibold text-right">Nilai Refund</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sale.items.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-3 font-medium text-sm text-gray-800">{item.name}</td>
                <td className="px-4 py-3 text-center text-sm">{item.quantity}</td>
                <td className="px-4 py-3">
                  <input 
                    type="number" min="0" max={item.quantity}
                    value={returnItems[index].returnQty}
                    onChange={(e) => handleQtyChange(index, Number(e.target.value))}
                    className="w-20 mx-auto px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={returnItems[index].condition}
                    onChange={(e) => handleConditionChange(index, e.target.value as 'GOOD' | 'DAMAGED')}
                    disabled={returnItems[index].returnQty === 0}
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-100"
                  >
                    <option value="GOOD">Layak Jual (Kembali ke Stok)</option>
                    <option value="DAMAGED">Rusak / Cacat</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 text-sm">
                  {formatRupiah(returnItems[index].returnQty * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Alasan Retur</label>
        <textarea 
          required
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Tuliskan alasan pengembalian barang..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
        ></textarea>
      </div>

      <div className="flex items-center justify-between p-4 bg-red-50 text-red-900 rounded-lg border border-red-100">
        <div>
          <h4 className="font-bold">Total Nilai Refund</h4>
          <p className="text-xs text-red-700 mt-1">Uang yang harus dikembalikan ke pelanggan (akan dicatat sebagai pengeluaran kas).</p>
        </div>
        <span className="text-2xl font-black">{formatRupiah(totalRefund)}</span>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button 
          type="button"
          onClick={() => router.push('/sales')}
          className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Batal
        </button>
        <button 
          type="submit" 
          disabled={isLoading || totalRefund === 0}
          className="px-6 py-2.5 bg-red-600 rounded-lg text-white font-medium hover:bg-red-700 transition disabled:opacity-50"
        >
          {isLoading ? 'Memproses...' : 'Proses Retur & Refund'}
        </button>
      </div>
    </form>
  )
}
