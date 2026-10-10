'use client'

import { useState, useRef } from 'react'
import { login, loginKasirWithSelfie } from '@/actions/auth'
import { Camera, UserCheck, CheckCircle2, Lock, ShieldCheck, ArrowRight, RefreshCw, User, Sparkles } from 'lucide-react'

interface CashierOption {
  id: string
  name: string
  username: string
}

export default function LoginClient({ registeredCashiers }: { registeredCashiers: CashierOption[] }) {
  const [activeTab, setActiveTab] = useState<'STANDARD' | 'KASIR'>('KASIR')
  
  // Standard Login State
  const [standardUsername, setStandardUsername] = useState('')
  const [standardPassword, setStandardPassword] = useState('')
  const [standardLoading, setStandardLoading] = useState(false)

  // Kasir Selfie Login State
  const [employeeInput, setEmployeeInput] = useState(registeredCashiers[0]?.name || '')
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [kasirLoading, setKasirLoading] = useState(false)
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      setErrorMessage(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsCameraActive(true)
      }
    } catch (e) {
      console.error('Webcam permission error:', e)
      setErrorMessage('Gagal mengakses kamera. Izinkan akses kamera browser Anda untuk selfie absensi.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
    }
  }

  const takeSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth || 300
      canvas.height = video.videoHeight || 300
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setCapturedSelfie(dataUrl)
        stopCamera()
      }
    }
  }

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setStandardLoading(true)
    const formData = new FormData()
    formData.append('username', standardUsername)
    formData.append('password', standardPassword)
    const result = await login(formData)
    if (result?.error) {
      setErrorMessage(result.error)
      setStandardLoading(false)
    }
  }

  const handleKasirSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    
    if (!employeeInput.trim()) {
      setErrorMessage('Pilih atau masukkan ID / Username Karyawan Kasir')
      return
    }

    if (!capturedSelfie) {
      setErrorMessage('Silakan ambil foto selfie absensi terlebih dahulu!')
      return
    }

    setKasirLoading(true)
    const result = await loginKasirWithSelfie({
      employeeIdOrUsername: employeeInput,
      selfieData: capturedSelfie
    })

    if (result?.error) {
      setErrorMessage(result.error)
      setKasirLoading(false)
    }
  }

  const isMatchedEmployee = registeredCashiers.some(
    e => e.name === employeeInput || e.username === employeeInput || e.id === employeeInput
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Branding Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-center text-white relative">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-md">
            <Sparkles size={28} className="text-yellow-300" />
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-tight uppercase">KASIRKU POS</h1>
          <p className="text-xs text-blue-100 mt-0.5 font-medium">Sistem Kasir & Absensi Selfie Karyawan</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-gray-100 p-1.5 gap-1 border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('KASIR'); setErrorMessage(null); }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'KASIR'
                ? 'bg-white text-blue-600 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Camera size={15} />
            <span>Login Kasir (Selfie)</span>
          </button>

          <button
            onClick={() => { setActiveTab('STANDARD'); setErrorMessage(null); stopCamera(); }}
            className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'STANDARD'
                ? 'bg-white text-blue-600 shadow-xs border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Lock size={15} />
            <span>Login Pengelola</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-5 bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold border border-red-200 text-center flex items-center justify-center gap-2">
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN KHUSUS KASIR (SELFIE ABSENSI) */}
          {activeTab === 'KASIR' && (
            <form onSubmit={handleKasirSubmit} className="space-y-4">
              {/* Employee ID Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Pilih / Input Karyawan Kasir</span>
                  {isMatchedEmployee ? (
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Karyawan Terdaftar
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold">Verifikasi ID...</span>
                  )}
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-3 text-gray-400 w-4 h-4 pointer-events-none" />
                  {registeredCashiers.length > 0 ? (
                    <select
                      value={employeeInput}
                      onChange={(e) => setEmployeeInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="" disabled>-- Pilih Karyawan Kasir Terdaftar --</option>
                      {registeredCashiers.map(emp => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} (@{emp.username})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={employeeInput}
                      onChange={(e) => setEmployeeInput(e.target.value)}
                      placeholder="Masukkan ID / Username Karyawan..."
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Webcam Selfie Photo Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Foto Selfie Absensi Masuk</span>
                  {capturedSelfie && (
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Foto Selfie Siap
                    </span>
                  )}
                </label>

                <div className="relative w-full h-48 bg-gray-900 rounded-2xl overflow-hidden border border-gray-300 flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {capturedSelfie && !isCameraActive && (
                    <img 
                      src={capturedSelfie} 
                      alt="Selfie Kasir" 
                      className="w-full h-full object-cover"
                    />
                  )}

                  {!isCameraActive && !capturedSelfie && (
                    <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                      <Camera size={40} className="opacity-40 mb-1.5 text-blue-400" />
                      <p className="text-xs font-bold text-gray-200">Ambil Foto Selfie Absensi</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Wajib selfie kamera sebelum masuk kasir</p>
                    </div>
                  )}
                </div>

                {/* Camera Control Buttons */}
                <div className="flex items-center gap-2">
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Camera size={15} />
                      <span>{capturedSelfie ? 'Foto Ulang Kamera' : 'Nyalakan Kamera WebCam'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={takeSelfie}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera size={15} />
                        <span>Ambil Foto Selfie</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3.5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Batal
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Action Submit */}
              <button
                type="submit"
                disabled={kasirLoading || !capturedSelfie || !employeeInput}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-black py-3 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                {kasirLoading ? 'Memverifikasi Data Kasir...' : 'Verifikasi Selfie & Masuk Kasir'}
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* TAB 2: STANDARD USERNAME & PASSWORD LOGIN (OWNER / ADMIN) */}
          {activeTab === 'STANDARD' && (
            <form onSubmit={handleStandardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Username Pengelola</label>
                <input
                  type="text"
                  value={standardUsername}
                  onChange={(e) => setStandardUsername(e.target.value)}
                  required
                  placeholder="Masukkan username Anda..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={standardPassword}
                  onChange={(e) => setStandardPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={standardLoading}
                className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-extrabold py-3 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
              >
                {standardLoading ? 'Memproses Login...' : 'Masuk Pengelola (Owner/Admin)'}
              </button>
            </form>
          )}

          {/* Demo Credentials Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400 space-y-0.5">
            <p className="font-semibold text-gray-500">Kredensial Demo:</p>
            <p className="font-mono text-[10px] text-gray-400">Kasir: kasir (Pass: password123) · Owner: owner</p>
          </div>
        </div>
      </div>
    </div>
  )
}
