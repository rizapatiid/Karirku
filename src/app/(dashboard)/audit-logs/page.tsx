import prisma from '@/lib/prisma'
import { Search, ShieldAlert } from 'lucide-react'

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
    take: 100
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Catatan Sistem (Audit Log)</h2>
          <p className="text-gray-500 text-sm mt-1">Pantau seluruh aktivitas pengguna dan perubahan data penting</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
          <ShieldAlert size={16} /> Keamanan Aktif
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari aktivitas, modul, atau user..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                <th className="px-6 py-3 font-semibold">Waktu</th>
                <th className="px-6 py-3 font-semibold">Pengguna</th>
                <th className="px-6 py-3 font-semibold">Modul</th>
                <th className="px-6 py-3 font-semibold text-center">Aksi</th>
                <th className="px-6 py-3 font-semibold">Deskripsi Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.createdAt.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{log.user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.module}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                      ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' : 
                        log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-700' :
                        log.action === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {log.description}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Belum ada log aktivitas.
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
