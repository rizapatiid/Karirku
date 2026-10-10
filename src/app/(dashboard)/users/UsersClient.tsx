'use client'

import { useState, useMemo } from 'react'
import { 
  Users, UserPlus, Search, ShieldCheck, ShieldAlert, Edit, Trash2, 
  Power, Check, X, Phone, Mail, User, Key, Filter, CheckCircle2, AlertCircle
} from 'lucide-react'
import { saveUser, deleteUser, toggleUserStatus } from '@/actions/user'

type Role = {
  id: string
  name: string
  description?: string | null
}

type UserItem = {
  id: string
  name: string
  username: string
  email?: string | null
  phone?: string | null
  roleId: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  role: Role
}

interface Props {
  initialUsers: UserItem[]
  roles: Role[]
  currentUserId?: string
}

export default function UsersClient({ initialUsers, roles, currentUserId }: Props) {
  const [usersList, setUsersList] = useState<UserItem[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  
  // Form State
  const [formName, setFormName] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRoleId, setFormRoleId] = useState(roles[0]?.id || '')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')

  // Feedback State
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Delete Confirmation State
  const [deleteCandidate, setDeleteCandidate] = useState<UserItem | null>(null)

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.includes(search)) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase()))

      const matchRole = selectedRoleFilter === 'ALL' || u.roleId === selectedRoleFilter
      const matchStatus = selectedStatusFilter === 'ALL' || u.status === selectedStatusFilter

      return matchSearch && matchRole && matchStatus
    })
  }, [usersList, search, selectedRoleFilter, selectedStatusFilter])

  const openAddModal = () => {
    setEditingUser(null)
    setFormName('')
    setFormUsername('')
    setFormPassword('')
    setFormRoleId(roles[0]?.id || '')
    setFormPhone('')
    setFormEmail('')
    setFormStatus('ACTIVE')
    setErrorMsg(null)
    setShowModal(true)
  }

  const openEditModal = (user: UserItem) => {
    setEditingUser(user)
    setFormName(user.name)
    setFormUsername(user.username)
    setFormPassword('')
    setFormRoleId(user.roleId)
    setFormPhone(user.phone || '')
    setFormEmail(user.email || '')
    setFormStatus(user.status)
    setErrorMsg(null)
    setShowModal(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setErrorMsg(null)

    const res = await saveUser({
      id: editingUser?.id,
      name: formName,
      username: formUsername,
      password: formPassword || undefined,
      roleId: formRoleId,
      phone: formPhone,
      email: formEmail,
      status: formStatus
    })

    if (res.success && res.user) {
      const saved: UserItem = res.user
      if (editingUser) {
        setUsersList(prev => prev.map(u => u.id === saved.id ? saved : u))
        setSuccessMsg(`Berhasil memperbarui data karyawan ${saved.name}!`)
      } else {
        setUsersList(prev => [saved, ...prev])
        setSuccessMsg(`Berhasil menambahkan karyawan baru ${saved.name}!`)
      }
      setShowModal(false)
      setTimeout(() => setSuccessMsg(null), 4000)
    } else {
      setErrorMsg(res.error || 'Gagal menyimpan data pengguna')
    }
    setProcessing(false)
  }

  const handleToggleStatus = async (user: UserItem) => {
    if (user.id === currentUserId) {
      alert('Anda tidak dapat menonaktifkan akun sendiri!')
      return
    }

    setProcessing(true)
    const res = await toggleUserStatus(user.id)
    if (res.success && res.user) {
      const updated: UserItem = res.user
      setUsersList(prev => prev.map(u => u.id === updated.id ? updated : u))
      setSuccessMsg(`Status ${updated.name} diubah menjadi ${updated.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}`)
      setTimeout(() => setSuccessMsg(null), 3000)
    } else {
      alert(res.error || 'Gagal mengubah status')
    }
    setProcessing(false)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return
    setProcessing(true)
    const res = await deleteUser(deleteCandidate.id)
    if (res.success) {
      setUsersList(prev => prev.filter(u => u.id !== deleteCandidate.id))
      setSuccessMsg(`Akun ${deleteCandidate.name} berhasil dihapus!`)
      setDeleteCandidate(null)
      setTimeout(() => setSuccessMsg(null), 3000)
    } else {
      alert(res.error || 'Gagal menghapus pengguna')
    }
    setProcessing(false)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Pengelola Akun & Karyawan</h2>
              <p className="text-xs text-gray-500 font-medium">Tambah, ubah, nonaktifkan, dan atur hak akses staff toko</p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs transition shadow-xs cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Tambah Karyawan / Akun Baru</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-2.5 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, username, atau no HP..." 
            className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold shrink-0">
            <Filter size={14} /> Filter:
          </div>
          
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Role</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif saja</option>
            <option value="INACTIVE">Non-Aktif saja</option>
          </select>
        </div>
      </div>

      {/* Table Data Karyawan / Pengguna */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="px-5 py-3.5 font-extrabold">Karyawan / Pengguna</th>
                <th className="px-5 py-3.5 font-extrabold">Username (ID Login)</th>
                <th className="px-5 py-3.5 font-extrabold text-center">Role / Wewenang</th>
                <th className="px-5 py-3.5 font-extrabold text-center">Status</th>
                <th className="px-5 py-3.5 font-extrabold text-center">Aksi / Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                    Tidak ada data pengguna atau karyawan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isOwner = u.role?.name?.toUpperCase() === 'OWNER'
                  const isAdmin = u.role?.name?.toUpperCase() === 'ADMIN'
                  const isSelf = u.id === currentUserId

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                  Anda
                                </span>
                              )}
                            </div>
                            {u.phone && (
                              <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                                <Phone size={11} /> {u.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-gray-700">
                        @{u.username}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border
                          ${isOwner ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                            isAdmin ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {isOwner && <ShieldAlert size={12} />}
                          {isAdmin && <ShieldCheck size={12} />}
                          {u.role?.name || 'Kasir'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold
                          ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'}`} />
                          {u.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition title='Edit Data'"
                          >
                            <Edit size={14} />
                          </button>

                          {/* Toggle Active Status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg border transition ${
                              u.status === 'ACTIVE' 
                                ? 'text-amber-600 hover:bg-amber-50 border-amber-200' 
                                : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                            } ${isSelf ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={u.status === 'ACTIVE' ? 'Non-aktifkan Akun' : 'Aktifkan Akun'}
                          >
                            <Power size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteCandidate(u)}
                            disabled={isSelf}
                            className={`p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition ${
                              isSelf ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            title="Hapus Akun"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  {editingUser ? <Edit size={18} /> : <UserPlus size={18} />}
                </div>
                <h3 className="text-base font-black text-gray-900">
                  {editingUser ? `Edit Data: ${editingUser.name}` : 'Tambah Karyawan / Pengguna Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap Karyawan *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="pl-9 pr-3.5 py-2 w-full bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Username (Kode Login) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Username (ID Login) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 font-mono text-xs font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Contoh: budi_kasir"
                    className="pl-8 pr-3.5 py-2 w-full bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Role / Wewenang & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Role / Wewenang *</label>
                  <select
                    value={formRoleId}
                    onChange={(e) => setFormRoleId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status Akun</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">Aktif (Bisa Login)</option>
                    <option value="INACTIVE">Non-Aktif (Di-blokir)</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {editingUser ? 'Password Baru (Opsional - Kosongkan jika tidak diubah)' : 'Password Login *'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? 'Masukkan password baru jika ingin mereset...' : 'Buat password login...'}
                    className="pl-9 pr-3.5 py-2 w-full bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* No Handphone (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">No. Handphone / WhatsApp (Opsional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="pl-9 pr-3.5 py-2 w-full bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition cursor-pointer disabled:opacity-50"
                >
                  {processing ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Tambah Karyawan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Konfirmasi Hapus Akun</h3>
                <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 font-medium">
              Apakah Anda yakin ingin menghapus akun karyawan <strong className="text-gray-900 font-black">{deleteCandidate.name}</strong> (@{deleteCandidate.username})?
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-extrabold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={processing}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer disabled:opacity-50"
              >
                {processing ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
