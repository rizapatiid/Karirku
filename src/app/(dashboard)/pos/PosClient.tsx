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
  unit: string
}

type CartItem = Product & { quantity: number }

export default function PosClient({ initialProducts }: { initialProducts: Product[] }) {
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [amountPaid, setAmountPaid] = useState<string>('')
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        if (existing.quantity >= product.stock) return prev // Can't add more than stock
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      if (product.stock <= 0) return prev
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta
        if (newQ > item.stock) return item
        if (newQ <= 0) return item
        return { ...item, quantity: newQ }
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id))

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discount = 0
  const total = subtotal - discount

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const handleCheckout = async () => {
    const paid = Number(amountPaid.replace(/[^0-9]/g, ''))
    if (paid < total) {
      setError('Jumlah pembayaran kurang dari total tagihan')
      return
    }

    setIsProcessing(true)
    setError(null)
    
    const result = await processCheckout({
      items: cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
      paymentMethod: 'CASH',
      amountPaid: paid,
      discount: discount
    })

    if (result.success) {
      setCheckoutSuccess(result.invoiceNumber!)
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaksi Berhasil!</h2>
        <p className="text-gray-500 mb-6">No. Invoice: <span className="font-mono font-medium text-gray-700">{checkoutSuccess}</span></p>
        
        <div className="flex gap-4">
          <button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition">
            Cetak Struk
          </button>
          <button 
            onClick={() => setCheckoutSuccess(null)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
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
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari produk atau scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
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
            Pesanan Saat Ini
          </h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
            {cart.length} Item
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">Keranjang masih kosong</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-800 line-clamp-1">{item.name}</h4>
                  <div className="text-blue-600 text-sm font-semibold">{formatRupiah(item.price)}</div>
                </div>
                
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 mt-2 bg-gray-50 rounded-md border border-gray-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-200 rounded-l-md"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-200 rounded-r-md"><Plus className="w-3 h-3" /></button>
                  </div>
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
          <div className="flex justify-between text-sm text-gray-600">
            <span>Diskon</span>
            <span>{formatRupiah(discount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-3">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

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
