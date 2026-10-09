'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { processCheckout } from '@/actions/pos'
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle2, QrCode, 
  CreditCard, Banknote, Building2, Utensils, ShoppingBag, Truck, 
  FileText, Keyboard, X, Sparkles, AlertCircle, Layers, UtensilsCrossed, 
  CupSoda, Coffee, Cookie, IceCream, Package, Printer, Wifi, Clock, 
  UserCheck, Receipt, ArrowRight, Zap, ShieldCheck
} from 'lucide-react'

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

// Render clean SVG Lucide component dynamically for category
const CategorySvgIcon = ({ name, size = 15 }: { name: string; size?: number }) => {
  const lower = name.toLowerCase()
  if (lower.includes('makan') || lower.includes('food')) return <UtensilsCrossed size={size} />
  if (lower.includes('minum') || lower.includes('drink') || lower.includes('beverage')) return <CupSoda size={size} />
  if (lower.includes('kopi') || lower.includes('coffee')) return <Coffee size={size} />
  if (lower.includes('snack') || lower.includes('camil')) return <Cookie size={size} />
  if (lower.includes('dessert') || lower.includes('es') || lower.includes('ice')) return <IceCream size={size} />
  if (lower.includes('paket') || lower.includes('combo')) return <Package size={size} />
  return <Layers size={size} />
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

  // Global Keyboard Shortcuts (F2 = Search, Esc = Clear)
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

  // Filter products by search & category
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

  // Smart Nominal Buttons helper (Calculates realistic quick cash buttons based on total)
  const smartCashOptions = useMemo(() => {
    if (total <= 0) return [50000, 100000, 200000]
    const opts = new Set<number>()
    opts.add(total) // Exact amount

    const next5k = Math.ceil(total / 5000) * 5000
    if (next5k > total) opts.add(next5k)

    const next10k = Math.ceil(total / 10000) * 10000
    if (next10k > total) opts.add(next10k)

    const next50k = Math.ceil(total / 50000) * 50000
    if (next50k > total) opts.add(next50k)

    if (total < 50000) opts.add(50000)
    if (total < 100000) opts.add(100000)

    return Array.from(opts).slice(0, 4)
  }, [total])

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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[520px] bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-3xl shadow-xl border border-gray-200 p-8 backdrop-blur-sm">
        <div className="w-24 h-24 bg-green-100/80 rounded-full flex items-center justify-center mb-5 shadow-inner">
          <CheckCircle2 className="w-14 h-14 text-green-600 animate-bounce" />
        </div>
        
        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Pembayaran Berhasil!</h2>
        <p className="text-gray-500 text-sm mb-4">Transaksi telah tersimpan dalam sistem database</p>
        
        {checkoutSuccess.queueNumber && (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl px-12 py-6 my-4 text-center shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">
              <Zap size={14} /> NOMOR ANTREAN PELANGGAN
            </div>
            <span className="text-6xl font-black tracking-tight font-mono">
              #{String(checkoutSuccess.queueNumber).padStart(3, '0')}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-gray-600 text-sm mb-6 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-2xs">
          <Receipt size={16} className="text-blue-600" />
          <span>No. Struk Invoice:</span>
          <span className="font-mono font-bold text-gray-900">{checkoutSuccess.invoice}</span>
        </div>
        
        <div className="flex gap-4">
          <a 
            href={`/sales/${checkoutSuccess.id}/receipt`} 
            target="_blank" 
            className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white text-sm rounded-2xl font-bold transition shadow-lg flex items-center gap-2.5"
          >
            <Printer size={18} /> Cetak Struk Belanja
          </a>
          <button 
            onClick={() => setCheckoutSuccess(null)}
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm rounded-2xl font-bold transition shadow-lg flex items-center gap-2"
          >
            <span>+ Transaksi Baru</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-7.5rem)]">
      {/* Kiri: Katalog Produk & Kategori */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Top Header Bar with Live Indicator & Search */}
        <div className="p-4 border-b border-gray-200 bg-white space-y-3">
          {/* Top Info Strip */}
          <div className="flex items-center justify-between text-xs text-gray-500 pb-1 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-bold text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <Wifi size={13} /> POS System Online
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-gray-500">
                <ShieldCheck size={13} className="text-blue-500" /> Terhubung Ke Database
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-gray-600">
              <Sparkles size={13} className="text-yellow-500" />
              <span>{storeConfig.name}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-gray-400 w-4 h-4" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Scan Barcode / Cari nama produk (F2)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
                className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm outline-none transition font-medium text-gray-800"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Customer Select */}
            <div className="relative">
              <UserCheck className="absolute left-3.5 top-3 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 outline-none font-bold appearance-none cursor-pointer"
              >
                <option value="">Pelanggan Umum</option>
                {initialCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pure SVG Lucide Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition shrink-0 flex items-center gap-2 ${
                selectedCategory === 'ALL'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Layers size={15} />
              <span>Semua Produk ({initialProducts.length})</span>
            </button>

            {initialCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition shrink-0 flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CategorySvgIcon name={cat.name} size={15} />
                <span>{cat.name}</span>
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
                  className={`relative border rounded-3xl p-4 cursor-pointer transition-all flex flex-col justify-between group ${
                    isOutOfStock 
                      ? 'bg-gray-100 border-gray-200 opacity-45 cursor-not-allowed' 
                      : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1'
                  }`}
                >
                  {/* Quantity In Cart Counter */}
                  {inCart && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md animate-pulse flex items-center gap-1">
                      <ShoppingCart size={11} />
                      {inCart.quantity}x
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1 flex items-center gap-1">
                      <CategorySvgIcon name={product.category} size={11} />
                      {product.sku}
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-end justify-between">
                    <div>
                      <div className="text-blue-600 font-black text-base">{formatRupiah(product.price)}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[10px] font-bold ${
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
              <Search size={44} className="opacity-25 mb-2" />
              <p className="font-bold text-sm text-gray-600">Tidak ada produk ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau klik Kategori 'Semua Produk'</p>
            </div>
          )}
        </div>

        {/* Footer Keyboard Help Bar with SVG Icons */}
        <div className="px-5 py-2.5 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Keyboard size={13} /> <b className="bg-white border border-gray-300 px-1.5 rounded-md shadow-2xs">F2</b> Cari Produk</span>
            <span className="flex items-center gap-1"><b className="bg-white border border-gray-300 px-1.5 rounded-md shadow-2xs">Esc</b> Kosongkan Keranjang</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 font-bold">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>{storeConfig.name}</span>
          </div>
        </div>
      </div>

      {/* Kanan: Ringkasan Pesanan & Pembayaran */}
      <div className="w-full lg:w-[440px] flex flex-col bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Keranjang */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-800">Keranjang Pesanan</h2>
            {cart.length > 0 && (
              <span className="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-full">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {heldOrders.length > 0 && (
              <select 
                onChange={(e) => handleLoadOrder(e.target.value)}
                className="text-xs border border-orange-300 bg-orange-50 font-bold text-orange-700 rounded-xl px-2.5 py-1.5 outline-none"
                value=""
              >
                <option value="" disabled>Panggil Hold ({heldOrders.length})</option>
                {heldOrders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
              </select>
            )}
            
            <button 
              onClick={handleHoldOrder}
              disabled={cart.length === 0}
              className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold px-3 py-1.5 rounded-xl disabled:opacity-40 transition"
              title="Tahan Pesanan (Hold)"
            >
              Hold
            </button>

            <button 
              onClick={() => { setCart([]); setAmountPaid(''); }}
              disabled={cart.length === 0}
              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl disabled:opacity-40 transition"
              title="Kosongkan Keranjang"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Order Type Tabs (Dine In / Takeaway / Delivery) */}
        <div className="grid grid-cols-3 bg-gray-100 p-1.5 gap-1.5 border-b border-gray-200">
          {[
            { type: 'DINE_IN', label: 'Dine In', icon: Utensils },
            { type: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag },
            { type: 'DELIVERY', label: 'Delivery', icon: Truck },
          ].map(item => (
            <button
              key={item.type}
              onClick={() => setOrderType(item.type as any)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                orderType === item.type 
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400 space-y-2">
              <ShoppingCart size={44} className="opacity-25" />
              <p className="text-sm font-bold text-gray-500">Keranjang Masih Kosong</p>
              <p className="text-xs text-gray-400">Pilih produk di sebelah kiri untuk menambah pesanan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                  <div className="text-blue-600 font-black text-xs mt-0.5">
                    {formatRupiah(item.price)} x {item.quantity} = <span className="text-gray-900 font-extrabold">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-lg text-gray-600 transition"><Minus size={13} /></button>
                    <span className="w-7 text-center text-xs font-black text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-lg text-gray-600 transition"><Plus size={13} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment & Checkout Section */}
        <div className="bg-white p-4 border-t border-gray-200 space-y-3">
          {/* Note Input */}
          <div className="relative">
            <FileText className="absolute left-3.5 top-2.5 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              placeholder="Catatan pesanan / No. Meja (opsional)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Subtotal & Tax */}
          <div className="space-y-1.5 text-xs text-gray-600 pt-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-gray-800">{formatRupiah(subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={useTax} onChange={(e) => setUseTax(e.target.checked)} className="rounded border-gray-300" />
                <span>Pajak & Layanan ({storeConfig.taxRate + storeConfig.serviceCharge}%)</span>
              </label>
              <span className="font-bold text-gray-800">{formatRupiah(taxAmount)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center text-lg font-black text-gray-900 border-t border-gray-200 pt-3">
            <span>TOTAL TAGIHAN</span>
            <span className="text-blue-600 text-2xl font-black">{formatRupiah(total)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">PILIH METODE PEMBAYARAN</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { method: 'CASH', label: 'Tunai', icon: Banknote },
                { method: 'QRIS', label: 'QRIS', icon: QrCode },
                { method: 'DEBIT', label: 'Debit', icon: CreditCard },
                { method: 'TRANSFER', label: 'Bank', icon: Building2 },
              ].map(pm => (
                <button
                  key={pm.method}
                  onClick={() => setPaymentMethod(pm.method as any)}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-2xl text-xs font-extrabold transition border ${
                    paymentMethod === pm.method
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <pm.icon size={16} className="mb-0.5" />
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Smart Quick Cash Buttons for CASH */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs font-bold text-gray-600">
                <span>Uang Diterima (CASH)</span>
                {Number(amountPaid) >= total && (
                  <span className="text-green-600 font-extrabold">Kembalian: {formatRupiah(Number(amountPaid) - total)}</span>
                )}
              </div>
              <input 
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Masukkan nominal..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-lg text-gray-900"
              />

              {/* Dynamic Smart Quick Cash Options */}
              <div className="grid grid-cols-4 gap-1.5">
                {smartCashOptions.map((opt, idx) => (
                  <button 
                    key={opt + idx}
                    onClick={() => setAmountPaid(opt.toString())} 
                    className="py-2 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border border-gray-200 rounded-xl text-[11px] font-black text-gray-800 transition truncate shadow-2xs"
                  >
                    {opt === total ? 'Uang Pas' : `${(opt / 1000).toLocaleString('id-ID')}k`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-100 font-bold">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Checkout Button */}
          <button 
            disabled={cart.length === 0 || isProcessing || (paymentMethod === 'CASH' && !amountPaid)}
            onClick={handleCheckout}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-base"
          >
            {isProcessing ? 'Memproses Transaksi...' : `Bayar Sekarang · ${formatRupiah(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
