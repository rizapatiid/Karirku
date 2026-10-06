'use client'

import { useState, useMemo } from 'react'
import { processCheckout } from '@/actions/pos'
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react'

type Product = {
  id: string
  sku: string
  name: string
  stock: number
  price: number
  category: string
  unit: string | null
  imageUrl: string | null
}

type Customer = { id: string, name: string, phone: string | null }
type CartItem = Product & { quantity: number }
type HeldOrder = { id: string, time: Date, cart: CartItem[] }

export default function PosClient({ initialProducts, initialCustomers, storeConfig }: { initialProducts: Product[], initialCustomers: Customer[], storeConfig: { taxActive: boolean, taxRate: number, serviceCharge: number } }) {
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [amountPaid, setAmountPaid] = useState<string>('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState<{invoice: string, id: string, queueNumber?: number | null} | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      const exactMatch = initialProducts.find(p => p.sku.toLowerCase() === search.toLowerCase())
      if (exactMatch) {
        addToCart(exactMatch)
        setSearch('')
      }
    }
  }

  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, initialProducts])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const handleHoldOrder = () => {
    if (cart.length === 0) return
    const newHold: HeldOrder = { id: `HOLD-${Date.now().toString().slice(-4)}`, time: new Date(), cart }
    setHeldOrders(prev => [...prev, newHold])
    setCart([])
    setAmountPaid('')
  }

  const handleLoadOrder = (id: string) => {
    const order = heldOrders.find(o => o.id === id)
    if (order) {
      setCart(order.cart)
      setHeldOrders(prev => prev.filter(o => o.id !== id))
    }
  }

  const [useTax, setUseTax] = useState(storeConfig.taxActive)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discount = 0
  const taxAmount = useTax ? (subtotal - discount) * (storeConfig.taxRate / 100) + (subtotal - discount) * (storeConfig.serviceCharge / 100) : 0
  const total = subtotal - discount + taxAmount

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const handleCheckout = async () => {
    const paid = Number(amountPaid.replace(/[^0-9]/g, ''))
    if (paid < total) {
      setError('Jumlah bayar kurang dari total!')
      return
    }

    setIsProcessing(true)
    setError(null)
    
    const result = await processCheckout({
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
      paymentMethod: 'CASH',
      customerId: selectedCustomer || undefined,
      amountPaid: paid,
      discount: discount, tax: taxAmount
    })

    if (result.success) {
      setCheckoutSuccess({ invoice: result.invoiceNumber!, id: result.saleId!, queueNumber: result.queueNumber })
      setCart([])
      setAmountPaid('')
    } else {
      setError(result.error || 'Terjadi kesalahan')
    }
    
    setIsProcessing(false)
  }

  if (checkoutSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Transaksi Berhasil!</h2>
        
        {checkoutSuccess.queueNumber && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-8 py-4 my-4 text-center shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Nomor Antrean</span>
            <span className="text-5xl font-black text-blue-700 tracking-tight">
              {String(checkoutSuccess.queueNumber).padStart(3, '0')}
            </span>
          </div>
        )}

        <p className="text-gray-500 mb-6">No. Invoice: <span className="font-mono font-medium text-gray-700">{checkoutSuccess.invoice}</span></p>
        
        <div className="flex gap-4">
          <a href={`/sales/${checkoutSuccess.id}/receipt`} target="_blank" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition">
            Cetak Struk
          </a>
          <button 
            onClick={() => setCheckoutSuccess(null)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-8rem)]">
      {/* Kiri: Daftar Produk */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari produk atau scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-[200px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-700"
          >
            <option value="">-- Pilih Pelanggan --</option>
            {initialCustomers.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className={`border rounded-lg p-4 cursor-pointer transition flex flex-col justify-between ${product.stock > 0 ? 'hover:border-blue-500 hover:shadow-md bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'}`}
              >
                <div>
                  <div className="text-xs text-gray-400 mb-1">{product.sku}</div>
                  <h3 className="font-medium text-gray-800 line-clamp-2 leading-tight">{product.name}</h3>
                </div>
                <div className="mt-3">
                  <div className="text-blue-600 font-bold">{formatRupiah(product.price)}</div>
                  <div className="text-xs text-gray-500 mt-1">Stok: {product.stock} {product.unit}</div>
                </div>
              </div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center text-gray-500 mt-10">Produk tidak ditemukan.</div>
          )}
        </div>
      </div>

      {/* Kanan: Keranjang */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Pesanan
          </h2>
          <div className="flex gap-2">
            {heldOrders.length > 0 && (
              <select 
                onChange={(e) => handleLoadOrder(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 outline-none bg-white text-gray-700 max-w-[100px]"
                value=""
              >
                <option value="" disabled>Panggil ({heldOrders.length})</option>
                {heldOrders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
              </select>
            )}
            <button 
              onClick={handleHoldOrder}
              disabled={cart.length === 0}
              className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded disabled:opacity-50 hover:bg-orange-200 transition"
              title="Simpan Antrean (Hold)"
            >
              Hold
            </button>
            <button 
              onClick={() => { setCart([]); setAmountPaid(''); }}
              disabled={cart.length === 0}
              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded disabled:opacity-50 hover:bg-red-200 transition"
              title="Kosongkan Keranjang"
            >
              <Trash2 size={14} />
            </button>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
              {cart.length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
              <ShoppingCart size={48} className="text-gray-300" />
              <p className="text-sm">Belum ada pesanan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 text-sm leading-tight">{item.name}</h4>
                  <div className="text-blue-600 font-bold text-sm mt-1">{formatRupiah(item.price)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useTax} onChange={(e) => setUseTax(e.target.checked)} className="rounded border-gray-300" />
              <span>Pajak & Layanan ({storeConfig.taxRate + storeConfig.serviceCharge}%)</span>
            </label>
            <span>{formatRupiah(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
            <span>Total</span>
            <span>{formatRupiah(total)}</span>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Diterima (CASH)</label>
            <input 
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Masukkan jumlah uang..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800"
            />
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              <button onClick={() => setAmountPaid(total.toString())} className="py-1.5 px-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded text-xs font-bold transition">Uang Pas</button>
              <button onClick={() => setAmountPaid('50000')} className="py-1.5 px-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-bold transition">50k</button>
              <button onClick={() => setAmountPaid('100000')} className="py-1.5 px-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-bold transition">100k</button>
              <button onClick={() => setAmountPaid('200000')} className="py-1.5 px-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs font-bold transition">200k</button>
            </div>
          </div>

          {Number(amountPaid) > total && (
            <div className="flex justify-between items-center bg-blue-50 text-blue-800 p-3 rounded-lg font-bold mt-3 border border-blue-100">
              <span>Kembalian:</span>
              <span>{formatRupiah(Number(amountPaid) - total)}</span>
            </div>
          )}

          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2 border border-red-100">{error}</div>}

          <button 
            disabled={cart.length === 0 || isProcessing || !amountPaid}
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition mt-2 shadow-sm"
          >
            {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}




