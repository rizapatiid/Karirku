'use client'

import { useState, useRef } from 'react'
import { login, loginKasirWithSelfie, validateCashierEmployee } from '@/actions/auth'
import { Camera, UserCheck, CheckCircle2, Lock, ShieldCheck, ArrowRight, X, User, Sparkles, AlertCircle } from 'lucide-react'

interface CashierOption {
  id: string
  name: string
  username: string
}

export default function LoginClient({ registeredCashiers }: { registeredCashiers: CashierOption[] }) {
  // Standard Login State
  const [standardUsername, setStandardUsername] = useState('')
  const [standardPassword, setStandardPassword] = useState('')
  const [standardLoading, setStandardLoading] = useState(false)
  const [mainError, setMainError] = useState<string | null>(null)

  // Kasir Popup Modal State
  const [showKasirModal, setShowKasirModal] = useState(false)
  const [employeeInput, setEmployeeInput] = useState(registeredCashiers[0]?.username || '')
  const [isValidating, setIsValidating] = useState(false)
  const [validatedEmployee, setValidatedEmployee] = useState<{ id: string; name: string; username: string; role?: string } | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  // WebCam Selfie States
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [kasirLoading, setKasirLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMainError(null)
    setStandardLoading(true)
    const formData = new FormData()
    formData.append('username', standardUsername)
    formData.append('password', standardPassword)
    const result = await login(formData)
    if (result?.error) {
      setMainError(result.error)
      setStandardLoading(false)
    }
  }

  const handleValidateEmployee = async () => {
    setModalError(null)
    if (!employeeInput.trim()) {
      setModalError('Masukkan ID atau Username Karyawan')
      return
    }

    setIsValidating(true)
    const res = await validateCashierEmployee(employeeInput)
    if (res.success && res.user) {
      setValidatedEmployee(res.user)
      setModalError(null)
    } else {
      setValidatedEmployee(null)
      setModalError(res.error || 'ID Karyawan tidak terdaftar dalam sistem!')
    }
    setIsValidating(false)
  }

  const startCamera = async () => {
    try {
      setModalError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsCameraActive(true)
      }
    } catch (e) {
      console.error('Webcam error:', e)
      setModalError('Gagal mengakses kamera. Izinkan akses kamera di browser Anda.')
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

  const handleKasirLogin = async () => {
    if (!validatedEmployee) {
      setModalError('Validasi ID Karyawan terlebih dahulu')
      return
    }
    if (!capturedSelfie) {
      setModalError('Silakan ambil foto selfie absensi terlebih dahulu')
      return
    }

    setModalError(null)
    setKasirLoading(true)
    const result = await loginKasirWithSelfie({
      employeeIdOrUsername: validatedEmployee.username,
      selfieData: capturedSelfie
    })

    if (result?.error) {
      setModalError(result.error)
      setKasirLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Simple Main Login Box */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-200/80">
        
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black shadow-md">
            K
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">KASIRKU POS</h1>
          <p className="text-gray-500 mt-0.5 text-xs">Masuk ke sistem operasional POS</p>
        </div>

        {mainError && (
          <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 text-center">
            {mainError}
          </div>
        )}

        {/* Form Standard Login */}
        <form onSubmit={handleStandardSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={standardUsername}
              onChange={(e) => setStandardUsername(e.target.value)}
              required
              placeholder="Masukkan username Anda..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={standardPassword}
              onChange={(e) => setStandardPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={standardLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold py-3 rounded-xl transition duration-200 shadow-sm cursor-pointer text-xs"
          >
            {standardLoading ? 'Memproses Login...' : 'Masuk Sistem'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-400"><span className="bg-white px-2">Atau</span></div>
        </div>

        {/* Dedicated Cashier Login Button BELOW Main Login Button */}
        <button
          type="button"
          onClick={() => { setShowKasirModal(true); setModalError(null); }}
          className="w-full py-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs group"
        >
          <UserCheck size={17} className="text-emerald-600 group-hover:scale-110 transition-transform" />
          <span>Login Sebagai Kasir (Absensi Selfie)</span>
          <ArrowRight size={15} className="text-emerald-600" />
        </button>

        {/* Footer Demo Info */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
          <p className="font-semibold text-gray-500">Demo User:</p>
          <p className="font-mono mt-0.5">kasir / owner / admin (Pass: password123)</p>
        </div>
      </div>

      {/* POPUP MODAL OVERLAY: LOGIN KHUSUS KASIR (VALIDASI ID + SELFIE) */}
      {showKasirModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 space-y-4 my-auto relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 shadow-2xs">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 leading-tight">Login Kasir & Absensi Selfie</h3>
                  <p className="text-[11px] text-gray-500">Validasi ID Karyawan dan Ambil Foto Selfie</p>
                </div>
              </div>
              <button 
                onClick={() => { stopCamera(); setShowKasirModal(false); }}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold border border-red-200 text-center flex items-center justify-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{modalError}</span>
              </div>
            )}

            {/* STEP 1: INPUT ID KARYAWAN & TOMBOL VALIDASI */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>1. Input / Pilih ID Karyawan Kasir</span>
                {validatedEmployee && (
                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                    <CheckCircle2 size={12} /> ID Terverifikasi
                  </span>
                )}
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={employeeInput}
                    onChange={(e) => { setEmployeeInput(e.target.value); setValidatedEmployee(null); }}
                    placeholder="Masukkan ID / Username Karyawan..."
                    className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleValidateEmployee}
                  disabled={isValidating || !employeeInput}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shrink-0"
                >
                  {isValidating ? 'Cek...' : 'Validasi ID'}
                </button>
              </div>

              {/* Status Banner after Validated */}
              {validatedEmployee && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Karyawan Valid: </span>
                    <span className="font-extrabold">{validatedEmployee.name}</span>
                    <span className="text-[10px] text-emerald-600 block">(@{validatedEmployee.username} · Role: {validatedEmployee.role})</span>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: WEBCAM SELFIE ABSENSI (UNLOCKED AFTER VALIDATED) */}
            <div className={`space-y-2 border-t border-gray-100 pt-3 transition-opacity ${validatedEmployee ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <label className="block text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>2. Foto Selfie Absensi Shift</span>
                {capturedSelfie && (
                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Foto Selfie Siap
                  </span>
                )}
              </label>

              <div className="relative w-full h-44 bg-gray-900 rounded-2xl overflow-hidden border border-gray-300 flex items-center justify-center shadow-inner">
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
                    <Camera size={36} className="opacity-40 mb-1 text-emerald-400" />
                    <p className="text-xs font-bold text-gray-200">Ambil Foto Selfie Absensi</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Wajib selfie kamera webcam untuk absen kasir</p>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex items-center gap-2">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={!validatedEmployee}
                    className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={14} />
                    <span>{capturedSelfie ? 'Foto Ulang Kamera' : 'Nyalakan Kamera WebCam'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={takeSelfie}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera size={14} />
                      <span>Ambil Foto Selfie</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* STEP 3: LANJUT LOGIN BUTTON */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { stopCamera(); setShowKasirModal(false); }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              
              <button
                type="button"
                disabled={kasirLoading || !validatedEmployee || !capturedSelfie}
                onClick={handleKasirLogin}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white text-xs font-extrabold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {kasirLoading ? 'Memproses Login...' : 'Lanjut Login & Masuk Kasir'}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
