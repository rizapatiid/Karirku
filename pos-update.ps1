$content = Get-Content -Raw -Path 'src\app\(dashboard)\pos\PosClient.tsx'

# Add Customer type
$content = $content -replace 'type CartItem = Product & \{ quantity: number \}', "type Customer = { id: string, name: string, phone: string | null }
type CartItem = Product & { quantity: number }"

# Update props
$content = $content -replace 'export default function PosClient\(\{ initialProducts \}: \{ initialProducts: Product\[\] \}\) \{', 'export default function PosClient({ initialProducts, initialCustomers }: { initialProducts: Product[], initialCustomers: Customer[] }) {'

# Add selectedCustomer state
$content = $content -replace 'const \[search, setSearch\] = useState\(''\)', "const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')"

# Add handleKeyDown for Barcode Auto-add
$content = $content -replace 'const filteredProducts = useMemo', "const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      const exactMatch = initialProducts.find(p => p.sku.toLowerCase() === search.toLowerCase())
      if (exactMatch) {
        addToCart(exactMatch)
        setSearch('')
      }
    }
  }

  const filteredProducts = useMemo"

# Pass customerId to processCheckout
$content = $content -replace "paymentMethod: 'CASH',", "paymentMethod: 'CASH',
      customerId: selectedCustomer || undefined,"

# Add Customer Select UI next to Search Bar
$newSearchUI = @'
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
              <option key={c.id} value={c.id}>{c.name} {c.phone ? () : ''}</option>
            ))}
          </select>
        </div>
'@
$content = $content -replace '(?s)<div className="p-4 border-b border-gray-200">.*?</div>', $newSearchUI

$content | Set-Content -Path 'src\app\(dashboard)\pos\PosClient.tsx'
