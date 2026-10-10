import prisma from '@/lib/prisma'
import ShiftSchedulesClient from './ShiftSchedulesClient'

export default async function SettingsShiftsPage() {
  const schedules = await prisma.shiftSchedule.findMany({
    orderBy: { createdAt: 'asc' }
  })

  return <ShiftSchedulesClient initialSchedules={JSON.parse(JSON.stringify(schedules))} />
}
