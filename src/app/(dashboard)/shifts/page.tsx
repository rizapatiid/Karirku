import prisma from '@/lib/prisma'
import { Clock, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Banknote, UserCheck, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function ShiftsPage() {
  const shifts = await prisma.shift.findMany({
    include: {
      user: true,
      store: true,
      sales: true,
    },
    orderBy: {
      startTime: 'desc',
    },
    take: 50,
  })

  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Clock size={15} /> Audit & Operasional Kasir
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Shift & Rekap Laci Kasir</h1>
          <p className="text-xs text-gray-500 mt-1">Laporan sesi shift kasir, modal awal, penjualan tunai, dan rekonsiliasi selisih kas fisik</p>
        </div>
        
        <Link 
          href="/kasir"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2"
        >
          <Banknote size={16} /> Ke Mesin Kasir
        </Link>
      </div>

      {/* Shifts Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Shift Tercatat</div>
            <div className="text-xl font-black text-gray-900 mt-0.5">{shifts.length} Sesi</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Shift Aktif Saat Ini</div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              {shifts.filter(s => s.status === 'OPEN').length} Kasir Online
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Selisih Kas (Audit)</div>
            <div className="text-xl font-black text-gray-900 mt-0.5">
              {formatRupiah(shifts.reduce((sum, s) => sum + Number(s.difference || 0), 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 font-extrabold text-sm text-gray-900 flex items-center justify-between">
          <span>Riwayat Sesi Shift Karyawan</span>
          <span className="text-xs font-semibold text-gray-500">Menampilkan {shifts.length} transaksi shift terakhir</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">No. Shift</th>
                <th className="px-5 py-3.5">Kasir / Karyawan</th>
                <th className="px-5 py-3.5">Waktu Shift</th>
                <th className="px-5 py-3.5 text-right">Modal Awal</th>
                <th className="px-5 py-3.5 text-right">Omset Tunai</th>
                <th className="px-5 py-3.5 text-right">Total Omset</th>
                <th className="px-5 py-3.5 text-right">Uang Fisik</th>
                <th className="px-5 py-3.5 text-center">Selisih</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {shifts.map(shift => {
                const diff = Number(shift.difference || 0)
                const isCurrentOpen = shift.status === 'OPEN'

                return (
                  <tr key={shift.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">{shift.shiftNumber}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {shift.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{shift.user.name}</div>
                          <div className="text-[10px] text-gray-400">@{shift.user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <div><strong className="text-gray-800">Buka:</strong> {new Date(shift.startTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      {shift.endTime ? (
                        <div className="text-[10px] text-gray-400"><strong className="text-gray-500">Tutup:</strong> {new Date(shift.endTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600">Sedang Berlangsung</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">{formatRupiah(Number(shift.startCash))}</td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-700">{formatRupiah(Number(shift.cashSales))}</td>
                    <td className="px-5 py-4 text-right font-black text-gray-900">{formatRupiah(Number(shift.totalSales))}</td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">
                      {isCurrentOpen ? '-' : formatRupiah(Number(shift.actualCash))}
                    </td>
                    <td className="px-5 py-4 text-center font-bold">
                      {isCurrentOpen ? (
                        <span className="text-gray-400">-</span>
                      ) : diff === 0 ? (
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">Pas (Rp 0)</span>
                      ) : diff > 0 ? (
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[10px]">+{formatRupiah(diff)}</span>
                      ) : (
                        <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 text-[10px]">{formatRupiah(diff)}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        isCurrentOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isCurrentOpen ? 'AKTIF' : 'SELESAI'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a 
                        href={`/receipt/shift/${shift.id}`} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold transition"
                        title="Lihat Struk Shift"
                      >
                        Struk <ArrowRight size={12} />
                      </a>
                    </td>
                  </tr>
                )
              })}

              {shifts.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400 font-bold">
                    Belum ada sesi shift kasir yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
