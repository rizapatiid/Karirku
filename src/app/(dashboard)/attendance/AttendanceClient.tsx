'use client'

import { useState, useRef, useMemo } from 'react'
import { 
  UserCheck, Camera, Clock, CheckCircle2, AlertCircle, Plus, Search, 
  Filter, ArrowRight, ShieldCheck, Users, Warehouse, ShoppingBag, LogOut,
  XCircle, Calendar, RefreshCw, BadgeCheck
} from 'lucide-react'
import { clockInAttendance, clockOutAttendance } from '@/actions/attendance'
import { validateCashierEmployee } from '@/actions/auth'

interface AttendanceItem {
  id: string
  userId: string
  clockIn: string
  clockOut: string | null
  selfieIn: string | null
  selfieOut: string | null
  roleType: string
  status: string
  notes: string | null
  user: {
    id: string
    name: string
    username: string
    role: { name: string }
  }
  shiftSchedule?: {
    name: string
    startTime: string
    endTime: string
  } | null
}

interface Summary {
  totalPresent: number
  kasirCount: number
  gudangCount: number
  staffCount: number
  clockedOutCount: number
}

interface ShiftScheduleItem {
  id: string
  name: string
  startTime: string
  endTime: string
}

export default function AttendanceClient({
  initialAttendances,
  initialSummary,
  employees,
  initialShiftSchedules = []
}: {
  initialAttendances: AttendanceItem[]
  initialSummary: Summary
  employees: { id: string; name: string; username: string }[]
  initialShiftSchedules?: ShiftScheduleItem[]
}) {
  const [attendances, setAttendances] = useState<AttendanceItem[]>(initialAttendances)
  const [summary, setSummary] = useState<Summary>(initialSummary)
  
  // Filter & Search
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('ALL')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'CLOCK_IN' | 'CLOCK_OUT'>('CLOCK_IN')
  const [selectedAttendanceForOut, setSelectedAttendanceForOut] = useState<AttendanceItem | null>(null)

  // Form State & Validation
  const [employeeInput, setEmployeeInput] = useState('')
  const [validatedUser, setValidatedUser] = useState<{ id: string; name: string; username: string; role: string } | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [roleType, setRoleType] = useState<'KASIR' | 'GUDANG' | 'STAFF'>('KASIR')
  const [notes, setNotes] = useState('')
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null)
  
  // Camera WebCam State
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Auto detect active shift based on master schedules or time fallbacks
  const detectedShift = useMemo(() => {
    const now = new Date()
    const currentMin = now.getHours() * 60 + now.getMinutes()

    if (initialShiftSchedules && initialShiftSchedules.length > 0) {
      for (const sch of initialShiftSchedules) {
        const [sH, sM] = sch.startTime.split(':').map(Number)
        const [eH, eM] = sch.endTime.split(':').map(Number)
        const startMin = sH * 60 + sM
        const endMin = eH * 60 + eM

        if (startMin < endMin) {
          if (currentMin >= startMin && currentMin < endMin) {
            return { name: sch.name, timeRange: `${sch.startTime} - ${sch.endTime} WIB` }
          }
        } else {
          // Overnight shift e.g. 23:00 - 07:00
          if (currentMin >= startMin || currentMin < endMin) {
            return { name: sch.name, timeRange: `${sch.startTime} - ${sch.endTime} WIB` }
          }
        }
      }
    }

    // Default time-based fallbacks if no DB master schedule match
    const hour = now.getHours()
    if (hour >= 7 && hour < 15) {
      return { name: 'Shift 1 (Pagi)', timeRange: '07:00 - 15:00 WIB' }
    } else if (hour >= 15 && hour < 23) {
      return { name: 'Shift 2 (Sore)', timeRange: '15:00 - 23:00 WIB' }
    } else {
      return { name: 'Shift 3 (Malam)', timeRange: '23:00 - 07:00 WIB' }
    }
  }, [initialShiftSchedules])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsCameraActive(true)
      }
    } catch (e) {
      console.error('Webcam error:', e)
      setError('Gagal mengaktifkan kamera. Izinkan akses kamera browser Anda.')
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

  const openClockInModal = () => {
    setModalMode('CLOCK_IN')
    setSelectedAttendanceForOut(null)
    setEmployeeInput('')
    setValidatedUser(null)
    setRoleType('KASIR')
    setNotes('')
    setCapturedSelfie(null)
    setError(null)
    setIsModalOpen(true)
  }

  const openClockOutModal = (att: AttendanceItem) => {
    setModalMode('CLOCK_OUT')
    setSelectedAttendanceForOut(att)
    setCapturedSelfie(null)
    setError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    stopCamera()
    setIsModalOpen(false)
  }

  const handleValidateEmployee = async () => {
    if (!employeeInput.trim()) {
      setError('Silakan masukkan ID / Username / Nama Karyawan')
      return
    }

    setIsValidating(true)
    setError(null)

    const res = await validateCashierEmployee(employeeInput)
    if (res.success && res.user) {
      setValidatedUser(res.user)
      if (res.user.role === 'GUDANG') setRoleType('GUDANG')
      else if (res.user.role === 'KASIR') setRoleType('KASIR')
      else setRoleType('STAFF')
    } else {
      setError(res.error || 'ID Karyawan tidak ditemukan di database!')
    }
    setIsValidating(false)
  }

  const handleClockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatedUser) {
      setError('Silakan validasi ID Karyawan terlebih dahulu')
      return
    }

    setLoading(true)
    setError(null)

    const res = await clockInAttendance({
      employeeIdOrUsername: validatedUser.id,
      roleType,
      selfieData: capturedSelfie || undefined,
      notes
    })

    if (res.success && res.attendance) {
      const newAtt = res.attendance as AttendanceItem
      setAttendances(prev => [newAtt, ...prev])
      setSummary(prev => ({
        ...prev,
        totalPresent: prev.totalPresent + 1,
        kasirCount: roleType === 'KASIR' ? prev.kasirCount + 1 : prev.kasirCount,
        gudangCount: roleType === 'GUDANG' ? prev.gudangCount + 1 : prev.gudangCount,
        staffCount: roleType === 'STAFF' ? prev.staffCount + 1 : prev.staffCount,
      }))
      setSuccess(`Absensi Masuk untuk ${newAtt.user.name} (${roleType}) berhasil dicatat!`)
      closeModal()
    } else {
      setError(res.error || 'Gagal menyimpan absensi')
    }
    setLoading(false)
  }

  const handleClockOutSubmit = async () => {
    if (!selectedAttendanceForOut) return

    setLoading(true)
    setError(null)

    const res = await clockOutAttendance(selectedAttendanceForOut.id, capturedSelfie || undefined)

    if (res.success && res.attendance) {
      const updated = res.attendance as AttendanceItem
      setAttendances(prev => prev.map(a => a.id === updated.id ? { ...a, clockOut: updated.clockOut, selfieOut: updated.selfieOut } : a))
      setSummary(prev => ({ ...prev, clockedOutCount: prev.clockedOutCount + 1 }))
      setSuccess(`Absensi Pulang untuk ${selectedAttendanceForOut.user.name} berhasil dicatat!`)
      closeModal()
    } else {
      setError(res.error || 'Gagal menyimpan absensi pulang')
    }
    setLoading(false)
  }

  // Filtered attendances list
  const filteredAttendances = attendances.filter(att => {
    const matchesSearch = att.user.name.toLowerCase().includes(search.toLowerCase()) || 
                          att.user.username.toLowerCase().includes(search.toLowerCase())
    const matchesRole = selectedRole === 'ALL' || att.roleType === selectedRole
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <UserCheck size={15} /> Presensi & Absensi Karyawan
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Absensi Shift Karyawan (Kasir & Gudang)</h1>
          <p className="text-xs text-gray-500 mt-1">Pencatatan absensi selfie & jam kerja karyawan shift (Kasir, Staff Gudang, Toko)</p>
        </div>

        <button
          onClick={openClockInModal}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <Camera size={16} /> Absensi Masuk (Selfie)
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" /> {success}
          </span>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer"><XCircle size={14} /></button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Hadir Hari Ini</div>
            <div className="text-xl font-black text-gray-900 mt-0.5">{summary.totalPresent} Karyawan</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Petugas Kasir</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{summary.kasirCount} Kasir Standby</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Warehouse size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Petugas Gudang</div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{summary.gudangCount} Gudang Standby</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <LogOut size={22} />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Sudah Clock Out</div>
            <div className="text-xl font-black text-purple-700 mt-0.5">{summary.clockedOutCount} Karyawan</div>
          </div>
        </div>
      </div>

      {/* Table & Controls */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama karyawan..."
              className="w-full pl-10 pr-3.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'KASIR', 'GUDANG', 'STAFF'].map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
                  selectedRole === role 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {role === 'ALL' ? 'Semua Peran' : role}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Selfie Masuk</th>
                <th className="px-5 py-3.5">Karyawan</th>
                <th className="px-5 py-3.5">Peran Shift</th>
                <th className="px-5 py-3.5">Jam Masuk (In)</th>
                <th className="px-5 py-3.5">Jam Pulang (Out)</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {filteredAttendances.map(att => {
                const isClockedOut = !!att.clockOut

                return (
                  <tr key={att.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-4">
                      {att.selfieIn ? (
                        <a href={att.selfieIn} target="_blank" title="Lihat Foto Selfie Masuk">
                          <img src={att.selfieIn} alt="Selfie Masuk" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-2xs hover:scale-110 transition" />
                        </a>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center text-[10px]">
                          No Foto
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-gray-900">{att.user.name}</div>
                      <div className="text-[10px] text-gray-400">@{att.user.username}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        att.roleType === 'KASIR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        att.roleType === 'GUDANG' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {att.roleType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700 font-mono">
                      <div><strong className="text-gray-900">{new Date(att.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong></div>
                      <div className="text-[10px] text-gray-400">{new Date(att.clockIn).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700 font-mono">
                      {att.clockOut ? (
                        <>
                          <div><strong className="text-purple-900">{new Date(att.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong></div>
                          <div className="text-[10px] text-gray-400">{new Date(att.clockOut).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</div>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Sedang Bekerja
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        isClockedOut ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isClockedOut ? 'SELESAI' : 'AKTIF'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!isClockedOut ? (
                        <button
                          onClick={() => openClockOutModal(att)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-extrabold transition shadow-2xs flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <LogOut size={12} /> Absen Pulang
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-bold">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filteredAttendances.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">
                    Belum ada riwayat absensi karyawan yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Absensi Selfie */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 shadow-2xs">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 leading-tight">
                    {modalMode === 'CLOCK_IN' ? 'Absensi Masuk Shift' : 'Absensi Pulang (Clock Out)'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {modalMode === 'CLOCK_IN' ? 'Verifikasi ID & Foto Selfie Karyawan' : `Karyawan: ${selectedAttendanceForOut?.user.name}`}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <XCircle size={20} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {modalMode === 'CLOCK_IN' ? (
              <form onSubmit={handleClockInSubmit} className="space-y-4">
                {/* Info Shift Aktif Saat Ini (Tampil Paling Atas Modal) */}
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/90 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-2xs shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <span>⏰ Shift Aktif Saat Ini</span>
                      </div>
                      <div className="text-xs font-black text-gray-900 flex items-center gap-1.5 mt-0.5">
                        <span className="text-amber-800 font-extrabold">{detectedShift.name}</span>
                        <span className="text-gray-500 text-[10px] font-bold">({detectedShift.timeRange})</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                    Otomatis
                  </span>
                </div>

                {/* Step 1: Input & Validasi ID Karyawan */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Input ID / Username / Nama Karyawan</span>
                    {validatedUser && (
                      <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                        <CheckCircle2 size={12} /> ID Terverifikasi
                      </span>
                    )}
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={employeeInput}
                      onChange={(e) => { setEmployeeInput(e.target.value); setValidatedUser(null); }}
                      placeholder="Masukkan ID / Username / Nama..."
                      className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={isValidating || !!validatedUser}
                      required
                    />
                    {!validatedUser ? (
                      <button
                        type="button"
                        onClick={handleValidateEmployee}
                        disabled={isValidating || !employeeInput.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isValidating ? 'Memvalidasi...' : 'Validasi ID'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setValidatedUser(null); stopCamera(); setCapturedSelfie(null); }}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        Ganti Karyawan
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 2: Form Absensi (Tampil Setelah ID Karyawan Valid) */}
                {validatedUser && (
                  <div className="space-y-4 pt-1 border-t border-gray-100">
                    {/* Card Karyawan Terverifikasi */}
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                        {validatedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full w-fit mb-0.5">
                          <BadgeCheck size={12} /> Karyawan Terdaftar
                        </div>
                        <h4 className="text-sm font-black text-gray-900 truncate">{validatedUser.name}</h4>
                        <p className="text-[10px] text-gray-500 font-medium">@{validatedUser.username} • Role: {validatedUser.role}</p>
                      </div>
                    </div>

                    {/* Selector Peran Shift */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Peran Tugas Shift Ini</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'KASIR', label: 'Kasir', icon: ShoppingBag },
                          { id: 'GUDANG', label: 'Gudang', icon: Warehouse },
                          { id: 'STAFF', label: 'Staff Toko', icon: Users },
                        ].map(item => {
                          const Icon = item.icon
                          const isSelected = roleType === item.id
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setRoleType(item.id as any)}
                              className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                                isSelected 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <Icon size={16} />
                              <span>{item.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Camera Box */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 flex items-center justify-between">
                        <span>Foto Selfie Absensi Masuk</span>
                        {capturedSelfie && (
                          <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                            <BadgeCheck size={12} /> Foto Terverifikasi
                          </span>
                        )}
                      </label>

                      <div className="relative w-full h-40 bg-gray-900 rounded-2xl overflow-hidden border border-gray-300 flex items-center justify-center">
                        <video ref={videoRef} className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`} />
                        <canvas ref={canvasRef} className="hidden" />

                        {capturedSelfie && !isCameraActive && (
                          <img src={capturedSelfie} alt="Selfie" className="w-full h-full object-cover" />
                        )}

                        {!isCameraActive && !capturedSelfie && (
                          <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                            <Camera size={32} className="opacity-40 mb-1" />
                            <p className="text-xs font-bold text-gray-300">Ambil foto webcam selfie</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCameraActive ? (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Camera size={14} />
                            <span>{capturedSelfie ? 'Foto Ulang' : 'Nyalakan Kamera'}</span>
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
                            <button type="button" onClick={stopCamera} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold">
                              Batal
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold">
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span>{loading ? 'Menyimpan...' : 'Simpan Absensi Masuk'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              /* Clock Out Form */
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center">
                    {selectedAttendanceForOut?.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">{selectedAttendanceForOut?.user.name}</h4>
                    <p className="text-xs text-purple-700 font-bold">Role: {selectedAttendanceForOut?.roleType}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">Foto Selfie Pulang (Opsional)</label>
                  <div className="relative w-full h-40 bg-gray-900 rounded-2xl overflow-hidden border border-gray-300 flex items-center justify-center">
                    <video ref={videoRef} className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`} />
                    <canvas ref={canvasRef} className="hidden" />

                    {capturedSelfie && !isCameraActive && (
                      <img src={capturedSelfie} alt="Selfie" className="w-full h-full object-cover" />
                    )}

                    {!isCameraActive && !capturedSelfie && (
                      <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                        <Camera size={32} className="opacity-40 mb-1" />
                        <p className="text-xs font-bold text-gray-300">Foto selfie pulang</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCameraActive ? (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera size={14} />
                        <span>Nyalakan Kamera</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={takeSelfie}
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-xs"
                      >
                        Ambil Foto
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold">
                    Batal
                  </button>
                  <button
                    onClick={handleClockOutSubmit}
                    disabled={loading}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? 'Menyimpan...' : 'Konfirmasi Absen Pulang'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
