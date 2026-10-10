'use client'

import { useState } from 'react'
import { Clock, Plus, Edit2, Trash2, CheckCircle2, XCircle, Shield, ArrowLeft, Save, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createShiftSchedule, updateShiftSchedule, deleteShiftSchedule } from '@/actions/shiftSchedule'

interface ShiftSchedule {
  id: string
  name: string
  startTime: string
  endTime: string
  notes: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export default function ShiftSchedulesClient({ initialSchedules }: { initialSchedules: ShiftSchedule[] }) {
  const [schedules, setSchedules] = useState<ShiftSchedule[]>(initialSchedules)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ShiftSchedule | null>(null)
  
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('07:00')
  const [endTime, setEndTime] = useState('15:00')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const openAddModal = () => {
    setEditingSchedule(null)
    setName('')
    setStartTime('07:00')
    setEndTime('15:00')
    setNotes('')
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (sch: ShiftSchedule) => {
    setEditingSchedule(sch)
    setName(sch.name)
    setStartTime(sch.startTime)
    setEndTime(sch.endTime)
    setNotes(sch.notes || '')
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !startTime || !endTime) {
      setError('Nama shift, jam mulai, dan jam selesai wajib diisi.')
      return
    }

    setLoading(true)
    setError(null)

    if (editingSchedule) {
      const res = await updateShiftSchedule(editingSchedule.id, { name, startTime, endTime, notes })
      if (res.success && res.schedule) {
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? (res.schedule as ShiftSchedule) : s))
        setSuccess('Jadwal shift berhasil diperbarui!')
        setIsModalOpen(false)
      } else {
        setError(res.error || 'Gagal memperbarui jadwal shift')
      }
    } else {
      const res = await createShiftSchedule({ name, startTime, endTime, notes })
      if (res.success && res.schedule) {
        setSchedules(prev => [...prev, res.schedule as ShiftSchedule])
        setSuccess('Jadwal shift baru berhasil ditambahkan!')
        setIsModalOpen(false)
      } else {
        setError(res.error || 'Gagal menambahkan jadwal shift')
      }
    }
    setLoading(false)
  }

  const handleToggleStatus = async (sch: ShiftSchedule) => {
    const newStatus = sch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const res = await updateShiftSchedule(sch.id, { status: newStatus })
    if (res.success && res.schedule) {
      setSchedules(prev => prev.map(s => s.id === sch.id ? (res.schedule as ShiftSchedule) : s))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus master jadwal shift ini?')) return
    const res = await deleteShiftSchedule(id)
    if (res.success) {
      setSchedules(prev => prev.filter(s => s.id !== id))
    } else {
      alert(res.error || 'Gagal menghapus shift')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
            <Link href="/settings" className="hover:underline flex items-center gap-1 text-gray-500">
              <ArrowLeft size={14} /> Pengaturan
            </Link>
            <span>/</span>
            <Clock size={15} /> Operational Shifts
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Pengaturan Jam Kerja Shift</h1>
          <p className="text-xs text-gray-500 mt-1">Kelola master jadwal shift (misal Shift 1 Pagi, Shift 2 Sore, Shift Malam) untuk kasir & karyawan</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> Tambah Jam Kerja Shift
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" /> {success}
          </span>
          <button onClick={() => setSuccess(null)} className="text-emerald-600 hover:text-emerald-900"><XCircle size={14} /></button>
        </div>
      )}

      {/* Preset Recommendations if empty */}
      {schedules.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Belum Ada Master Jam Kerja Shift</h3>
            <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
              Tambahkan master shift kerja agar operasional kasir terstruktur dengan baik sesuai jam operasional toko Anda.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Buat Shift Pertama Now
          </button>
        </div>
      )}

      {/* Shifts Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules.map(sch => (
          <div key={sch.id} className={`bg-white rounded-2xl border p-5 shadow-xs transition hover:shadow-md ${sch.status === 'ACTIVE' ? 'border-gray-200' : 'border-gray-200 opacity-60 bg-gray-50'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black border border-amber-100 shadow-2xs">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">{sch.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold mt-0.5">
                    <span>{sch.startTime}</span>
                    <span>-</span>
                    <span>{sch.endTime} WIB</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleToggleStatus(sch)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer border transition ${
                  sch.status === 'ACTIVE' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                    : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {sch.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
              </button>
            </div>

            {sch.notes && (
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 font-medium">
                {sch.notes}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => openEditModal(sch)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={() => handleDelete(sch.id)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="text-amber-600" size={20} />
                <h3 className="text-base font-black text-gray-900">
                  {editingSchedule ? 'Edit Jam Kerja Shift' : 'Tambah Jam Kerja Shift Baru'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <XCircle size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Shift</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Shift 1 (Pagi), Shift 2 (Sore)"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Catatan / Keterangan (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan misal: Istirahat 12:00-13:00"
                  rows={2}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{loading ? 'Menyimpan...' : 'Simpan Shift'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
