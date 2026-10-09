'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { processCheckout } from '@/actions/pos'
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle2, QrCode, CreditCard, Banknote, Building2, Tag, Utensils, ShoppingBag, Truck, FileText, Keyboard } from 'lucide-react'

type Product = {
  id: string
  sku: string
  name: string
  stock: number
  price: number
  category: string
  categoryId: string
  unit: string | null
  imageUrl: string | null
}

type Category = { id: string; name: string }
type Customer = { id: string; name: string; phone: string | null }
type CartItem = Product & { quantity: number; note?: string }
type HeldOrder = { id: string; time: Date; cart: CartItem[]; orderType: string; note: string }

interface Props {
  initialProducts: Product[]
  initialCategories: Category[]
  initialCustomers: Customer[]
  storeConfig: {
    name: string
    taxActive: boolean
    taxRate: number
    serviceCharge: number
    receiptFooter: string
    paymentInfo: string
  }
}

export default function PosClient({ initialProducts, initialCategories, initialCustomers, storeConfig }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT' | 'TRANSFER'>('CASH')
  const [orderNote, setOrderNote] = useState('')

  const [cart, setCart] = useState<CartItem[]>([])
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [amountPaid, setAmountPaid] = useState<string>('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState<{ invoice: string; id: string; queueNumber?: number | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        if (cart.length > 0 && confirm('Kosongkan keranjang belanja?')) {
          setCart([])
          setAmountPaid('')
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [cart])

  // Barcode / Enter search auto-add
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      const exactMatch = initialProducts.find(p => p.sku.toLowerCase() === search.toLowerCase())
      if (exactMatch && exactMatch.stock > 0) {
        addToCart(exactMatch)
        setSearch('')
      }
    }
  }

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [search, selectedCategory, initialProducts])

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          setError(`Stok maksimal ${product.name} telah tercapai (${product.stock})`)
          setTimeout(() => setError(null), 3000)
          return prev
        }
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
        const product = initialProducts.find(p => p.id === id)
        const newQty = item.quantity + delta
        if (product && newQty > product.stock) {
          setError(`Stok maksimal ${product.name} adalah ${product.stock}`)
          setTimeout(() => setError(null), 3000)
          return item
        }
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
    const newHold: HeldOrder = { 
      id: `HOLD-${Date.now().toString().slice(-4)}`, 
      time: new Date(), 
      cart,
      orderType,
      note: orderNote 
    }
    setHeldOrders(prev => [...prev, newHold])
    setCart([])
    setAmountPaid('')
    setOrderNote('')
  }

  const handleLoadOrder = (id: string) => {
    const order = heldOrders.find(o => o.id === id)
    if (order) {
      setCart(order.cart)
      setOrderType(order.orderType as any)
      setOrderNote(order.note)
      setHeldOrders(prev => prev.filter(o => o.id !== id))
    }
  }

  const [useTax, setUseTax] = useState(storeConfig.taxActive)
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discount = 0
  const taxAmount = useTax ? (subtotal - discount) * ((storeConfig.taxRate + storeConfig.serviceCharge) / 100) : 0
  const total = subtotal - discount + taxAmount

  // Auto-fill exact amount for QRIS/Debit/Transfer
  useEffect(() => {
    if (paymentMethod !== 'CASH') {
      setAmountPaid(total.toString())
    }
  }, [paymentMethod, total])

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const handleCheckout = async () => {
    const paid = Number(amountPaid.replace(/[^0-9]/g, ''))
    if (paymentMethod === 'CASH' && paid < total) {
      setError('Jumlah uang pembayaran kurang dari total!')
      return
    }

    setIsProcessing(true)
    setError(null)
    
    const result = await processCheckout({
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
      paymentMethod,
      customerId: selectedCustomer || undefined,
      amountPaid: paymentMethod === 'CASH' ? paid : total,
      discount: discount, 
      tax: taxAmount
    })

    if (result.success) {
      setCheckoutSuccess({ invoice: result.invoiceNumber!, id: result.saleId!, queueNumber: result.queueNumber })
      setCart([])
      setAmountPaid('')
      setOrderNote('')
    } else {
      setError(result.error || 'Terjadi kesalahan sistem saat checkout')
    }
    
    setIsProcessing(false)
  }

  if (checkoutSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Transaksi Berhasil!</h2>
        
        {checkoutSuccess.queueNumber && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-10 py-5 my-5 text-center shadow-inner">
            <span className="text-xs font-black text-blue-600 uppercase tracking-widest block">NOMOR ANTREAN</span>
            <span className="text-6xl font-black text-blue-700 tracking-tight">
              {String(checkoutSuccess.queueNumber).padStart(3, '0')}
            </span>
          </div>
        )}

        <p className="text-gray-500 mb-6 text-sm">No. Invoice: <span className="font-mono font-bold text-gray-800">{checkoutSuccess.invoice}</span></p>
        
        <div className="flex gap-4">
          <a 
            href={`/sales/${checkoutSuccess.id}/receipt`} 
            target="_blank" 
            className="px-6 py-3 bg-gray-900 hover:bg-black text-white text-sm rounded-xl font-bold transition shadow"
          >
            🖨️ Cetak Struk
          </a>
          <button 
            onClick={() => setCheckoutSuccess(null)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-xl font-bold transition shadow"
          >
            + Transaksi Baru
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-7.5rem)]">
      {/* Kiri: Katalog Produk & Kategori */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Top Filter Bar */}
        <div className="p-4 border-b border-gray-200 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Cari produk / scan barcode (F2)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm outline-none transition"
              />
            </div>

            {/* Customer Select */}
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 outline-none font-medium"
            >
              <option value="">-- Pelanggan Umum --</option>
              {initialCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua Produk ({initialProducts.length})
            </button>
            {initialCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.id === product.id)
              const isOutOfStock = product.stock <= 0
              const isLowStock = product.stock > 0 && product.stock <= 5

              return (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`relative border rounded-2xl p-3.5 cursor-pointer transition-all flex flex-col justify-between group ${
                    isOutOfStock 
                      ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed' 
                      : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Active In-Cart Badge */}
                  {inCart && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      {inCart.quantity}x
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">{product.sku}</div>
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-end justify-between">
                    <div>
                      <div className="text-blue-600 font-extrabold text-sm">{formatRupiah(product.price)}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[10px] font-semibold ${
                          isOutOfStock ? 'text-red-500 font-bold' : isLowStock ? 'text-yellow-600 font-bold' : 'text-gray-400'
                        }`}>
                          Stok: {product.stock} {product.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <Search size={40} className="opacity-30 mb-2" />
              <p className="font-medium text-sm">Tidak ada produk ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba kata kunci pencarian atau kategori lain</p>
            </div>
          )}
        </div>

        {/* Footer shortcuts bar */}
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Keyboard size={12} /> <b className="bg-white border px-1 rounded">F2</b> Cari Produk</span>
            <span className="flex items-center gap-1"><b className="bg-white border px-1 rounded">Esc</b> Reset</span>
          </div>
          <span>KASIRKU POS Enterprise</span>
        </div>
      </div>

      {/* Kanan: Ringkasan Pesanan & Pembayaran */}
      <div className="w-full lg:w-[420px] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Keranjang */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-800">Keranjang Pesanan</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {heldOrders.length > 0 && (
              <select 
                onChange={(e) => handleLoadOrder(e.target.value)}
                className="text-xs border border-orange-300 bg-orange-50 font-bold text-orange-700 rounded-lg px-2 py-1 outline-none"
                value=""
              >
                <option value="" disabled>Panggil Hold ({heldOrders.length})</option>
                {heldOrders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
              </select>
            )}
            
            <button 
              onClick={handleHoldOrder}
              disabled={cart.length === 0}
              className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold px-2.5 py-1 rounded-lg disabled:opacity-40 transition"
              title="Tahan Pesanan (Hold)"
            >
              Hold
            </button>

            <button 
              onClick={() => { setCart([]); setAmountPaid(''); }}
              disabled={cart.length === 0}
              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-40 transition"
              title="Kosongkan Keranjang"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Order Type Tabs (Dine In / Takeaway / Delivery) */}
        <div className="grid grid-cols-3 bg-gray-100 p-1.5 gap-1 border-b border-gray-200">
          {[
            { type: 'DINE_IN', label: 'Dine In', icon: Utensils },
            { type: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag },
            { type: 'DELIVERY', label: 'Delivery', icon: Truck },
          ].map(item => (
            <button
              key={item.type}
              onClick={() => setOrderType(item.type as any)}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition ${
                orderType === item.type 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart size={40} className="opacity-30" />
              <p className="text-sm font-medium">Keranjang masih kosong</p>
              <p className="text-xs text-gray-400">Klik produk di sebelah kiri untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                  <div className="text-blue-600 font-extrabold text-xs mt-0.5">
                    {formatRupiah(item.price)} x {item.quantity} = <span className="text-gray-900">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded text-gray-600 transition"><Minus size={12} /></button>
                    <span className="w-7 text-center text-xs font-black text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded text-gray-600 transition"><Plus size={12} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment & Checkout Section */}
        <div className="bg-white p-4 border-t border-gray-200 space-y-3">
          {/* Note Input */}
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              placeholder="Catatan pesanan / No. Meja (opsional)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Subtotal & Tax */}
          <div className="space-y-1.5 text-xs text-gray-600 pt-1">
            <div className="flex justify-between">
              <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} item)</span>
              <span className="font-semibold text-gray-800">{formatRupiah(subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={useTax} onChange={(e) => setUseTax(e.target.checked)} className="rounded border-gray-300" />
                <span>Pajak & PB1 ({storeConfig.taxRate + storeConfig.serviceCharge}%)</span>
              </label>
              <span className="font-semibold text-gray-800">{formatRupiah(taxAmount)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center text-lg font-black text-gray-900 border-t border-gray-200 pt-2.5">
            <span>TOTAL</span>
            <span className="text-blue-600 text-xl">{formatRupiah(total)}</span>
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-2 pt-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">Metode Pembayaran</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { method: 'CASH', label: 'Cash', icon: Banknote },
                { method: 'QRIS', label: 'QRIS', icon: QrCode },
                { method: 'DEBIT', label: 'Debit', icon: CreditCard },
                { method: 'TRANSFER', label: 'Bank', icon: Building2 },
              ].map(pm => (
                <button
                  key={pm.method}
                  onClick={() => setPaymentMethod(pm.method as any)}
                  className={`flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold transition border ${
                    paymentMethod === pm.method
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <pm.icon size={16} className="mb-0.5" />
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid Input for CASH */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Diterima (CASH)</span>
                {Number(amountPaid) >= total && (
                  <span className="text-green-600">Kembali: {formatRupiah(Number(amountPaid) - total)}</span>
                )}
              </div>
              <input 
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Masukkan nominal uang..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-extrabold text-base text-gray-900"
              />
              <div className="grid grid-cols-4 gap-1.5">
                <button onClick={() => setAmountPaid(total.toString())} className="py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold transition">Uang Pas</button>
                <button onClick={() => setAmountPaid('50000')} className="py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold transition">50k</button>
                <button onClick={() => setAmountPaid('100000')} className="py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold transition">100k</button>
                <button onClick={() => setAmountPaid('200000')} className="py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold transition">200k</button>
              </div>
            </div>
          )}

          {error && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 font-medium">{error}</div>}

          {/* Checkout Button */}
          <button 
            disabled={cart.length === 0 || isProcessing || (paymentMethod === 'CASH' && !amountPaid)}
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-base"
          >
            {isProcessing ? 'Memproses...' : `Bayar Sekarang ${formatRupiah(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
