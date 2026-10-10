import prisma from '@/lib/prisma'
import AttendanceClient from './AttendanceClient'
import { getAttendances, getTodayAttendanceSummary } from '@/actions/attendance'

export default async function AttendancePage() {
  const [attendancesRes, summaryRes, employees, shiftSchedules] = await Promise.all([
    getAttendances(),
    getTodayAttendanceSummary(),
    prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' }
    }),
    prisma.shiftSchedule.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { startTime: 'asc' }
    })
  ])

  return (
    <AttendanceClient
      initialAttendances={attendancesRes.attendances || []}
      initialSummary={summaryRes.summary || { totalPresent: 0, kasirCount: 0, gudangCount: 0, staffCount: 0, clockedOutCount: 0 }}
      employees={JSON.parse(JSON.stringify(employees))}
      initialShiftSchedules={JSON.parse(JSON.stringify(shiftSchedules || []))}
    />
  )
}
