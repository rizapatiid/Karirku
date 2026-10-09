'use client'

import { useEffect, useState, useCallback } from 'react'

type QueueStatus = 'WAITING' | 'CALLED' | 'SERVING' | 'DONE' | 'SKIPPED'

interface QueueItem {
  id: string
  number: number
  label: string
  status: QueueStatus
  calledAt: string | null
}

interface Props {
  storeName: string
  logoUrl: string | null
}

// Play pleasant chime bell using Web Audio API (no external file needed)
const playChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    }

    playTone(523.25, 0.0, 0.6)
    playTone(659.25, 0.25, 0.8)
  } catch (e) {
    console.error('Audio chime error:', e)
  }
}

// Indonesian Text-to-Speech Voice Call
const speakIndonesianQueue = (num: number) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()

  const paddedNum = num.toString().padStart(3, '0').split('').join(' ')
  const text = `Nomor antrean ${paddedNum}, silakan menuju kasir.`

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'id-ID'
  utterance.rate = 0.88
  utterance.pitch = 1.05

  const voices = window.speechSynthesis.getVoices()
  const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID'))
  if (idVoice) utterance.voice = idVoice

  window.speechSynthesis.speak(utterance)
}

export default function QueueDisplay({ storeName, logoUrl }: Props) {
  const [queues, setQueues] = useState<QueueItem[]>([])
  const [time, setTime] = useState<Date | null>(null)
  const [prevCalled, setPrevCalled] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)

  const called = queues.find(q => q.status === 'CALLED')
  const waiting = queues.filter(q => q.status === 'WAITING')
  const recentDone = queues.filter(q => q.status === 'DONE' || q.status === 'SKIPPED').slice(-5).reverse()

  // Clock (client-side only to prevent hydration mismatch)
  useEffect(() => {
    setTime(new Date())
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Load voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  }, [])

  // Announcement trigger function
  const announceQueue = useCallback((num: number) => {
    playChime()
    setTimeout(() => {
      speakIndonesianQueue(num)
    }, 700)
  }, [])

  // Poll queue every 3 seconds
  useEffect(() => {
    const fetch_ = () => {
      fetch('/api/queue')
        .then(r => r.json())
        .then((data: QueueItem[]) => {
          const newCalled = data.find(q => q.status === 'CALLED')
          if (newCalled && newCalled.number !== prevCalled) {
            setPrevCalled(newCalled.number)
            setFlash(true)
            announceQueue(newCalled.number)
            setTimeout(() => setFlash(false), 4000)
          }
          setQueues(data)
        })
        .catch(() => {})
    }
    fetch_()
    const t = setInterval(fetch_, 3000)
    return () => clearInterval(t)
  }, [prevCalled, announceQueue])

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${flash ? 'bg-blue-600' : 'bg-gray-900'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-10 py-5 border-b ${flash ? 'border-blue-400' : 'border-gray-700'}`}>
        <div className="flex items-center gap-4">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain bg-white rounded-xl p-1" />
          )}
          <div>
            <h1 className="text-white text-2xl font-black tracking-widest uppercase">{storeName}</h1>
            <p className={`text-sm font-medium ${flash ? 'text-blue-200' : 'text-gray-400'}`}>Sistem Antrian Digital</p>
          </div>
        </div>

        {/* Clock */}
        <div className="text-right">
          <p className="text-white text-4xl font-black font-mono tabular-nums">
            {time ? time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
          </p>
          <p className={`text-sm ${flash ? 'text-blue-200' : 'text-gray-400'}`}>
            {time ? time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 p-8 gap-8">
        {/* Left: Big current number */}
        <div className={`flex-1 flex flex-col items-center justify-center rounded-3xl border-2 ${flash ? 'border-white bg-blue-500' : 'border-gray-700 bg-gray-800'}`}>
          <p className={`text-lg font-bold uppercase tracking-widest mb-4 ${flash ? 'text-blue-100' : 'text-gray-400'}`}>
            {flash ? '🔔 Sedang Dipanggil' : 'Nomor Dilayani'}
          </p>
          <div className={`text-[180px] font-black leading-none tracking-tight ${flash ? 'text-white' : 'text-blue-400'}`}>
            {called ? called.number.toString().padStart(3, '0') : '---'}
          </div>
          {called?.label && (
            <p className={`text-2xl mt-4 font-medium ${flash ? 'text-blue-100' : 'text-gray-400'}`}>{called.label}</p>
          )}
          {!called && (
            <p className="text-gray-500 text-xl mt-4">Menunggu panggilan kasir...</p>
          )}
        </div>

        {/* Right panel */}
        <div className="w-80 flex flex-col gap-6">
          {/* Waiting count */}
          <div className="bg-yellow-500 rounded-2xl p-6 text-center">
            <p className="text-yellow-900 font-bold text-sm uppercase tracking-wider">Antrian Menunggu</p>
            <p className="text-yellow-900 text-7xl font-black mt-2">{waiting.length}</p>
          </div>

          {/* Next up */}
          {waiting.slice(0, 5).length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex-1">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Antrian Berikutnya</p>
              <div className="space-y-2">
                {waiting.slice(0, 5).map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                      {q.number.toString().padStart(3, '0')}
                    </span>
                    {q.label && <span className="text-gray-300 text-sm truncate">{q.label}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently done */}
          {recentDone.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Baru Selesai</p>
              <div className="flex flex-wrap gap-2">
                {recentDone.map(q => (
                  <span key={q.id} className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs bg-gray-700 text-gray-500 line-through">
                    {q.number.toString().padStart(3, '0')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer ticker */}
      <div className={`px-10 py-3 border-t text-center text-sm font-medium ${flash ? 'border-blue-400 text-blue-100' : 'border-gray-700 text-gray-500'}`}>
        Silakan perhatikan layar ini dan tunggu nomor antrian Anda dipanggil oleh kasir • KASIRKU POS System
      </div>
    </div>
  )
}
