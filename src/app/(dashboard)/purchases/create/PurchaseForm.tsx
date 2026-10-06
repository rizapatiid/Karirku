'use client'

import { useState } from 'react'
import { createPurchase } from '@/actions/purchase'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'

export default function PurchaseForm({ suppliers, products }: { suppliers: any[], products: any[] }) {
  const router = useRouter()
  const [supplierId, setSupplierId] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'RECEIVED'>('RECEIVED')
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitCost: 0 }])
  const [isLoading, setIsLoading] = useState(false)

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    const newItems = [...items]
    newItems[index] = { ...newItems[index], productId, unitCost: product ? product.price : 0 }
    setItems(newItems)
  }

  const handleItemChange = (index: number, field: string, value: number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const addItem = () => setItems([...items, { productId: '', quantity: 1, unitCost: 0 }])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId || items.some(i => !i.productId || i.quantity <= 0)) {
      alert('Mohon lengkapi data supplier dan produk.')
      return
    }

    setIsLoading(true)
    const res = await createPurchase({ supplierId, items, status })
    if (res.success) {
      router.push('/purchases')
    } else {
      alert(res.error)
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Supplier</label>
          <select 
            required 
            value={supplierId} 
            onChange={e => setSupplierId(e.target.value)} 
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Pilih Supplier...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Status Pembelian</label>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value as any)} 
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="DRAFT">DRAFT (Belum Diterima)</option>
            <option value="RECEIVED">RECEIVED (Barang Diterima & Stok Bertambah)</option>
          </select>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Produk</th>
              <th className="px-4 py-3 font-semibold w-24 text-center">Qty</th>
              <th className="px-4 py-3 font-semibold w-40 text-right">Harga Beli</th>
              <th className="px-4 py-3 font-semibold w-40 text-right">Subtotal</th>
              <th className="px-4 py-3 font-semibold w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, index) => (
              <tr key={index}>
                <td className="px-4 py-3">
                  <select 
                    required 
                    value={item.productId} 
                    onChange={e => handleProductSelect(index, e.target.value)} 
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="">Pilih Produk...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="number" min="1" required 
                    value={item.quantity} 
                    onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} 
                    className="w-full px-2 py-1 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="number" min="0" required 
                    value={item.unitCost} 
                    onChange={e => handleItemChange(index, 'unitCost', Number(e.target.value))} 
                    className="w-full px-2 py-1 border rounded text-right text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </td>
                <td className="px-4 py-3 font-medium text-right text-sm text-gray-800">
                  Rp {(item.quantity * item.unitCost).toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 text-center">
                  <button type="button" onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-600 transition" disabled={items.length === 1}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
            <Plus size={16} /> Tambah Baris
          </button>
          <div className="font-bold text-gray-900">
            Total: Rp {subtotal.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Pembelian'}
        </button>
      </div>
    </form>
  )
}
