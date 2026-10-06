import { getSession } from '@/actions/auth'
import OwnerDashboard from './OwnerDashboard'
import AdminDashboard from './AdminDashboard'
import CashierDashboard from './CashierDashboard'
import { redirect } from 'next/navigation'

export default async function DashboardController() {
  const session = await getSession()
  if (!session) redirect('/login')

  if (session.role === 'ADMIN') {
    return <AdminDashboard />
  }

  if (session.role === 'CASHIER') {
    return <CashierDashboard />
  }

  // Default to OWNER view
  return <OwnerDashboard />
}
