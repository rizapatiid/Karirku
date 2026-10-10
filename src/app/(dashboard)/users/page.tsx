import prisma from '@/lib/prisma'
import { getSession } from '@/actions/auth'
import UsersClient from './UsersClient'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'ADMIN' && session.role !== 'Owner' && session.role !== 'Admin')) {
    redirect('/')
  }

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { role: true }
    }),
    prisma.role.findMany({
      orderBy: { name: 'asc' }
    })
  ])

  const plainUsers = (users || []).map(u => ({
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    phone: u.phone,
    roleId: u.roleId,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
    role: {
      id: u.role.id,
      name: u.role.name,
      description: u.role.description
    }
  }))

  const plainRoles = (roles || []).map(r => ({
    id: r.id,
    name: r.name,
    description: r.description
  }))

  return (
    <UsersClient 
      initialUsers={plainUsers}
      roles={plainRoles}
      currentUserId={session.userId}
    />
  )
}
