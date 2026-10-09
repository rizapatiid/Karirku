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

  // Global Keyboard Shortcuts (F2 = Search, Esc = Clear, 1-4 = Smart Cash)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'

      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        if (cart.length > 0 && confirm('Kosongkan keranjang belanja?')) {
          setCart([])
          setAmountPaid('')
        }
      } else if (!isInputFocused && paymentMethod === 'CASH' && ['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1
        if (smartCashOptions[index] !== undefined) {
          e.preventDefault()
          setAmountPaid(smartCashOptions[index].toString())
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [cart, paymentMethod, smartCashOptions])

  // Auto-fill exact amount for QRIS/Debit/Transfer
  useEffect(() => {
    if (paymentMethod !== 'CASH') {
      setAmountPaid(total.toString())
    }
  }, [paymentMethod, total])

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const handleDirectPrint = (saleId: string) => {
    const iframeId = 'direct-print-iframe'
    let iframe = document.getElementById(iframeId) as HTMLIFrameElement
    
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = iframeId
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      document.body.appendChild(iframe)
    }

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (e) {
        console.error('Direct print error:', e)
      }
    }

    iframe.src = `/sales/${saleId}/receipt`
  }

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
      // Auto-trigger direct print without opening new tab
      setTimeout(() => {
        handleDirectPrint(result.saleId!)
      }, 300)
    } else {
      setError(result.error || 'Terjadi kesalahan sistem saat checkout')
    }
    
    setIsProcessing(false)
  }



  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full min-h-[calc(100vh-7.5rem)]">
      {/* Kiri: Katalog Produk & Kategori */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Top Header Bar with Live Indicator & Search */}
        <div className="p-3.5 border-b border-gray-200 bg-white space-y-3">
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

          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 text-gray-400 w-4 h-4" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Scan Barcode / Cari nama produk (F2)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
                className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs outline-none transition font-medium text-gray-800"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Customer Select */}
            <div className="relative">
              <UserCheck className="absolute left-3.5 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs text-gray-700 outline-none font-bold appearance-none cursor-pointer"
              >
                <option value="">Pelanggan Umum</option>
                {initialCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pure SVG Lucide Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1.5 ${
                selectedCategory === 'ALL'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Layers size={14} />
              <span>Semua Produk ({initialProducts.length})</span>
            </button>

            {initialCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CategorySvgIcon name={cat.name} size={14} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-3 overflow-y-auto bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.find(i => i.id === product.id)
              const isOutOfStock = product.stock <= 0
              const isLowStock = product.stock > 0 && product.stock <= 5

              return (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`relative border rounded-xl p-2.5 cursor-pointer transition-all flex flex-col justify-between group ${
                    isOutOfStock 
                      ? 'bg-gray-100 border-gray-200 opacity-45 cursor-not-allowed' 
                      : 'bg-white border-gray-200/90 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center text-blue-500 border border-blue-100/50 shrink-0">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-0.5 group-hover:scale-110 transition-transform duration-300">
                        <CategorySvgIcon name={product.category} size={30} />
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{product.unit || 'PRODUK'}</span>
                      </div>
                    )}

                    {/* Quantity In Cart Counter */}
                    {inCart && (
                      <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse flex items-center gap-1">
                        <ShoppingCart size={10} />
                        {inCart.quantity}x
                      </div>
                    )}

                    {/* Stock Warning Badge */}
                    {isLowStock && !isOutOfStock && (
                      <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded-md shadow-xs uppercase">
                        Stok Sedikit
                      </span>
                    )}

                    {isOutOfStock && (
                      <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-md shadow-xs uppercase">
                        Habis
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <div className="text-[9px] font-bold text-gray-400 tracking-wider uppercase mb-0.5 flex items-center gap-1">
                      <CategorySvgIcon name={product.category} size={10} />
                      <span>{product.sku}</span>
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-xs line-clamp-1 leading-snug group-hover:text-blue-600 transition">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-end justify-between">
                    <div>
                      <div className="text-blue-600 font-black text-sm leading-tight">{formatRupiah(product.price)}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[9px] font-bold ${
                          isOutOfStock ? 'text-red-500 font-bold' : isLowStock ? 'text-amber-600 font-bold' : 'text-gray-400'
                        }`}>
                          Stok: {product.stock} {product.unit || 'pcs'}
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
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 font-medium">
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
      <div className="w-full lg:w-[370px] xl:w-[390px] flex flex-col bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden shrink-0">
        {/* Header Keranjang */}
        <div className="px-3.5 py-2.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-100/80 text-blue-600 rounded-lg">
              <ShoppingCart size={15} />
            </div>
            <h2 className="font-black text-gray-900 text-sm tracking-tight">Keranjang</h2>
            {cart.length > 0 && (
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                {cart.reduce((a, b) => a + b.quantity, 0)} Item
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            {heldOrders.length > 0 && (
              <select 
                onChange={(e) => handleLoadOrder(e.target.value)}
                className="text-[11px] border border-amber-300 bg-amber-50 font-extrabold text-amber-800 rounded-lg px-2 py-1 outline-none shadow-2xs"
                value=""
              >
                <option value="" disabled>Hold ({heldOrders.length})</option>
                {heldOrders.map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
              </select>
            )}
            
            <button 
              onClick={handleHoldOrder}
              disabled={cart.length === 0}
              className="text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-bold px-2 py-1 rounded-lg disabled:opacity-40 transition shadow-2xs flex items-center gap-1"
              title="Tahan Pesanan (Hold)"
            >
              <Clock size={12} />
              <span>Hold</span>
            </button>

            <button 
              onClick={() => { setCart([]); setAmountPaid(''); }}
              disabled={cart.length === 0}
              className="p-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-lg disabled:opacity-40 transition shadow-2xs"
              title="Kosongkan Keranjang"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Order Type Tabs (Dine In / Takeaway / Delivery) */}
        <div className="grid grid-cols-3 bg-gray-100 p-1 gap-1 border-b border-gray-200">
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
                  ? 'bg-white text-blue-600 shadow-xs border border-gray-200 font-black' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <item.icon size={13} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto min-h-[120px] p-2.5 bg-gray-50/50 space-y-1.5">
          {cart.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center text-gray-400 space-y-1">
              <ShoppingCart size={32} className="opacity-25" />
              <p className="text-xs font-bold text-gray-500">Keranjang Masih Kosong</p>
              <p className="text-[11px] text-gray-400">Pilih produk untuk menambah pesanan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white p-2 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between gap-2">
                {/* Cart Item Thumbnail (Image or SVG Category Icon) */}
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/60 shadow-2xs">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <CategorySvgIcon name={item.category} size={18} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-gray-900 text-xs truncate leading-tight">{item.name}</h4>
                  <div className="text-blue-600 font-black text-[11px] mt-0.5">
                    {formatRupiah(item.price)} x {item.quantity} = <span className="text-gray-900 font-extrabold">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-md text-gray-600 transition"><Minus size={11} /></button>
                    <span className="w-5 text-center text-xs font-black text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-md text-gray-600 transition"><Plus size={11} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1 transition"><Trash2 size={13} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment & Checkout Section - Sticky Bottom */}
        <div className="mt-auto bg-white p-3 border-t border-gray-200 space-y-2 shrink-0 sticky bottom-0 z-10 shadow-md">
          {/* Note Input */}
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              placeholder="Catatan pesanan / No. Meja (opsional)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Subtotal & Tax */}
          <div className="space-y-1 text-[11px] text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">{formatRupiah(subtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={useTax} onChange={(e) => setUseTax(e.target.checked)} className="rounded border-gray-300" />
                <span>Pajak & Layanan ({storeConfig.taxRate + storeConfig.serviceCharge}%)</span>
              </label>
              <span className="font-bold text-gray-900">{formatRupiah(taxAmount)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center border-t border-gray-200 pt-1.5">
            <span className="text-xs font-black text-gray-900 uppercase tracking-wider">TOTAL TAGIHAN</span>
            <span className="text-blue-600 text-xl font-black">{formatRupiah(total)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1">
            <label className="block text-[9px] font-black uppercase tracking-wider text-gray-400">METODE PEMBAYARAN</label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { method: 'CASH', label: 'Tunai', icon: Banknote },
                { method: 'QRIS', label: 'QRIS', icon: QrCode },
                { method: 'DEBIT', label: 'Debit', icon: CreditCard },
                { method: 'TRANSFER', label: 'Bank', icon: Building2 },
              ].map(pm => (
                <button
                  key={pm.method}
                  onClick={() => setPaymentMethod(pm.method as any)}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[11px] font-extrabold transition border ${
                    paymentMethod === pm.method
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <pm.icon size={13} className="mb-0.5" />
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Smart Quick Cash Buttons for CASH */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span className="flex items-center gap-1">
                  <span>Uang Diterima</span>
                  <span className="text-[9px] text-gray-400 font-medium">(Tekan 1-4 di keyboard)</span>
                </span>
                {Number(amountPaid) >= total && (
                  <span className="text-green-600 font-extrabold">Kembali: {formatRupiah(Number(amountPaid) - total)}</span>
                )}
              </div>
              <input 
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Masukkan nominal..."
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-black text-base text-gray-900"
              />

              {/* Dynamic Smart Quick Cash Options with 1-4 Shortcut Badges */}
              <div className="grid grid-cols-4 gap-1">
                {smartCashOptions.map((opt, idx) => {
                  const keyNum = idx + 1
                  const isSelected = amountPaid === opt.toString()
                  return (
                    <button 
                      key={opt + idx}
                      onClick={() => setAmountPaid(opt.toString())} 
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-extrabold transition flex items-center justify-between border ${
                        isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : 'bg-gray-50 hover:bg-blue-50/70 text-gray-800 border-gray-200 hover:border-blue-300'
                      }`}
                      title={`Shortcut keyboard tekan angka ${keyNum}`}
                    >
                      <span className={`text-[9px] px-1 rounded font-mono font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {keyNum}
                      </span>
                      <span className="truncate">
                        {opt === total ? 'Uang Pas' : `${(opt / 1000).toLocaleString('id-ID')}k`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 font-bold">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Checkout Button */}
          <button 
            disabled={cart.length === 0 || isProcessing || (paymentMethod === 'CASH' && !amountPaid)}
            onClick={handleCheckout}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-extrabold py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-2 text-sm"
          >
            {isProcessing ? 'Memproses Transaksi...' : `Bayar Sekarang · ${formatRupiah(total)}`}
          </button>
        </div>
      </div>

      {/* Checkout Success Liquid Glass Popup Modal Overlay */}
      {checkoutSuccess && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white/85 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3),0_0_20px_0_rgba(255,255,255,0.6)_inset] border border-white/80 p-8 text-center flex flex-col items-center overflow-hidden transform animate-in zoom-in-95 duration-200">
            {/* Top Glossy Liquid Reflection Highlight */}
            <div className="absolute -top-24 -left-24 w-52 h-52 bg-gradient-to-br from-white/90 via-white/30 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            
            <h2 className="relative text-2xl font-black text-gray-900 tracking-tight">Pembayaran Berhasil!</h2>
            <p className="relative text-gray-500 text-xs mt-1 font-medium">Transaksi tersimpan di sistem database</p>
            
            {checkoutSuccess.queueNumber && (
              <div className="relative w-full bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-md text-white rounded-2xl p-5 my-5 shadow-lg shadow-blue-500/25 border border-white/20 text-center overflow-hidden">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-blue-100 uppercase tracking-widest">
                  <Zap size={12} /> NOMOR ANTREAN
                </div>
                <div className="text-5xl font-black tracking-tight font-mono mt-1 drop-shadow-sm">
                  #{String(checkoutSuccess.queueNumber).padStart(3, '0')}
                </div>
              </div>
            )}

            <div className="relative inline-flex items-center gap-2 bg-white/70 backdrop-blur-xs text-gray-700 px-4 py-2 rounded-xl border border-white/80 text-xs font-semibold mb-6 shadow-xs">
              <Receipt size={14} className="text-blue-600" />
              <span>No. Invoice: <strong className="font-mono text-gray-900">{checkoutSuccess.invoice}</strong></span>
            </div>
            
            <div className="relative grid grid-cols-2 gap-3 w-full">
              <button 
                onClick={() => handleDirectPrint(checkoutSuccess.id)}
                className="py-3 px-4 bg-slate-900/90 hover:bg-slate-950 text-white text-xs rounded-xl font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer border border-slate-700/50 backdrop-blur-xs"
              >
                <Printer size={16} /> Cetak Struk
              </button>
              <button 
                onClick={() => setCheckoutSuccess(null)}
                className="py-3 px-4 bg-blue-600/90 hover:bg-blue-600 text-white text-xs rounded-xl font-bold transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer border border-blue-400/40 backdrop-blur-xs"
              >
                <span>+ Transaksi Baru</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
