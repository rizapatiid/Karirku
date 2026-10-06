'use client'

import { useState, useTransition, useEffect } from 'react'
import { Users, Bell, CheckCircle, XCircle, SkipForward, RotateCcw, Plus, Monitor } from 'lucide-react'
import { addQueue, callQueue, callNextQueue, doneQueue, skipQueue, resetTodayQueue } from '@/actions/queue'
import Link from 'next/link'

type QueueStatus = 'WAITING' | 'CALLED' | 'SERVING' | 'DONE' | 'SKIPPED'

interface QueueItem {
  id: string
  number: number
  label: string
  status: QueueStatus
  calledAt: Date | null
  servedAt: Date | null
  createdAt: Date
}

interface Props {
  initialQueues: QueueItem[]
}

const STATUS_LABEL: Record<QueueStatus, string> = {
  WAITING: 'Menunggu',
  CALLED: 'Dipanggil',
  SERVING: 'Dilayani',
  DONE: 'Selesai',
  SKIPPED: 'Dilewati',
}

const STATUS_COLOR: Record<QueueStatus, string> = {
  WAITING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  CALLED: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
  SERVING: 'bg-green-50 text-green-700 border-green-200',
  DONE: 'bg-gray-50 text-gray-500 border-gray-200',
  SKIPPED: 'bg-red-50 text-red-400 border-red-200',
}

export default function QueueClient({ initialQueues }: Props) {
  const [queues, setQueues] = useState<QueueItem[]>(initialQueues)
  const [label, setLabel] = useState('')
  const [isPending, startTransition] = useTransition()
  const [calledNumber, setCalledNumber] = useState<number | null>(null)

  const currentCalled = queues.find(q => q.status === 'CALLED')
  const waiting = queues.filter(q => q.status === 'WAITING')
  const done = queues.filter(q => q.status === 'DONE' || q.status === 'SKIPPED')

  // Refresh every 5 seconds for real-time feel
  useEffect(() => {
    const t = setInterval(() => {
      window.location.reload()
    }, 10000)
    return () => clearInterval(t)
  }, [])

  const handleAddQueue = () => {
    startTransition(async () => {
      await addQueue(label)
      setLabel('')
      window.location.reload()
    })
  }

  const handleCallNext = () => {
    startTransition(async () => {
      const num = await callNextQueue()
      if (num) {
        setCalledNumber(num)
        setTimeout(() => setCalledNumber(null), 4000)
      }
      window.location.reload()
    })
  }

  const handleReset = () => {
    if (!confirm('Reset semua antrian hari ini? Semua data antrian akan dihapus.')) return
    startTransition(async () => {
      await resetTodayQueue()
      window.location.reload()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sistem Antrian</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola antrian pelanggan secara real-time</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/queue/display"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition"
          >
            <Monitor size={16} />
            Layar Antrian
          </Link>
          <button
            onClick={handleReset}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg border border-red-200 transition"
          >
            <RotateCcw size={16} />
            Reset Hari Ini
          </button>
        </div>
      </div>

      {/* Flash Notification */}
      {calledNumber && (
        <div className="fixed inset-x-0 top-6 flex justify-center z-50">
          <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 text-2xl font-bold animate-bounce">
            <Bell size={32} />
            Nomor {calledNumber.toString().padStart(3, '0')} Dipanggil!
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Antrian', value: queues.length, color: 'text-gray-800', bg: 'bg-white' },
          { label: 'Menunggu', value: waiting.length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Sedang Dilayani', value: queues.filter(q => q.status === 'CALLED' || q.status === 'SERVING').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Selesai', value: done.length, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl border border-gray-200 p-4 text-center`}>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Currently Called */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-blue-600 px-4 py-3">
              <h3 className="text-white font-bold flex items-center gap-2"><Bell size={16} /> Nomor Dipanggil</h3>
            </div>
            <div className="p-6 text-center">
              {currentCalled ? (
                <div>
                  <div className="text-6xl font-black text-blue-600 tracking-tight">
                    {currentCalled.number.toString().padStart(3, '0')}
                  </div>
                  {currentCalled.label && (
                    <p className="text-gray-500 text-sm mt-1">{currentCalled.label}</p>
                  )}
                  <div className="flex gap-2 mt-4 justify-center">
                    <button
                      onClick={() => startTransition(async () => { await doneQueue(currentCalled.id); window.location.reload() })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle size={14} /> Selesai
                    </button>
                    <button
                      onClick={() => startTransition(async () => { await skipQueue(currentCalled.id); window.location.reload() })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200"
                    >
                      <XCircle size={14} /> Lewati
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">
                  <div className="text-5xl font-black">---</div>
                  <p className="text-sm mt-2">Belum ada yang dipanggil</p>
                </div>
              )}
            </div>
          </div>

          {/* Call Next Button */}
          <button
            onClick={handleCallNext}
            disabled={isPending || waiting.length === 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg transition"
          >
            <SkipForward size={22} />
            Panggil Berikutnya
            {waiting.length > 0 && (
              <span className="bg-white text-blue-600 text-sm font-bold px-2 py-0.5 rounded-full">
                {waiting.length}
              </span>
            )}
          </button>

          {/* Info Card: Automatic Queue */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-blue-900">
              💡 Antrian Otomatis Terhubung
            </p>
            <p className="text-blue-700 leading-relaxed">
              Setiap kali kasir menyelesaikan transaksi pembayaran di POS, nomor antrian akan dibuat dan ditambahkan secara otomatis ke daftar antrian di atas.
            </p>
          </div>
        </div>

        {/* Right: Queue List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              Daftar Antrian Hari Ini
            </h3>
            <span className="text-xs text-gray-400">Auto-refresh 10 detik</span>
          </div>
          
          {queues.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada antrian hari ini</p>
              <p className="text-sm mt-1">Klik "+ Tambah Antrian" untuk memulai</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
              {queues.map(q => (
                <div key={q.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shrink-0 border ${
                    q.status === 'CALLED' ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' :
                    q.status === 'SERVING' ? 'bg-green-500 text-white border-green-500' :
                    q.status === 'DONE' ? 'bg-gray-100 text-gray-400 border-gray-200' :
                    q.status === 'SKIPPED' ? 'bg-red-50 text-red-300 border-red-100' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {q.number.toString().padStart(3, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLOR[q.status]}`}>
                        {STATUS_LABEL[q.status]}
                      </span>
                      {q.label && <span className="text-sm text-gray-600 truncate">{q.label}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Masuk: {new Date(q.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      {q.calledAt && ` · Dipanggil: ${new Date(q.calledAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                  {q.status === 'WAITING' && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startTransition(async () => { await callQueue(q.id); window.location.reload() })}
                        title="Panggil nomor ini"
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                      >
                        <Bell size={14} />
                      </button>
                      <button
                        onClick={() => startTransition(async () => { await skipQueue(q.id); window.location.reload() })}
                        title="Lewati"
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
