'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardChart({ data }: { data: any[] }) {
  const formatRupiah = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}K`
    return `Rp ${value}`
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tickFormatter={formatRupiah}
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <Tooltip 
            cursor={{ fill: '#F3F4F6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value), 'Pendapatan']}
          />
          <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

