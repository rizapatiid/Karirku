'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getAttendances(filter?: { date?: string; roleType?: string }) {
  try {
    const whereClause: any = {}

    if (filter?.roleType && filter.roleType !== 'ALL') {
      whereClause.roleType = filter.roleType
    }

    if (filter?.date) {
      const startOfDay = new Date(filter.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(filter.date)
      endOfDay.setHours(23, 59, 59, 999)
      whereClause.clockIn = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, username: true, role: { select: { name: true } } }
        },
        shiftSchedule: true
      },
      orderBy: { clockIn: 'desc' },
      take: 100
    })

    return { success: true, attendances: JSON.parse(JSON.stringify(attendances)) }
  } catch (error) {
    console.error('Error fetching attendances:', error)
    return { success: false, error: 'Gagal mengambil data absensi', attendances: [] }
  }
}

export async function getTodayAttendanceSummary() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        clockIn: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      include: {
        user: {
          select: { name: true, role: { select: { name: true } } }
        }
      }
    })

    const totalPresent = todayAttendances.length
    const kasirCount = todayAttendances.filter(a => a.roleType === 'KASIR' || a.user.role.name === 'KASIR').length
    const gudangCount = todayAttendances.filter(a => a.roleType === 'GUDANG').length
    const staffCount = todayAttendances.filter(a => a.roleType === 'STAFF' || a.roleType === 'ADMIN').length
    const clockedOutCount = todayAttendances.filter(a => a.clockOut !== null).length

    return {
      success: true,
      summary: {
        totalPresent,
        kasirCount,
        gudangCount,
        staffCount,
        clockedOutCount
      }
    }
  } catch (error) {
    console.error('Error getting attendance summary:', error)
    return {
      success: false,
      summary: { totalPresent: 0, kasirCount: 0, gudangCount: 0, staffCount: 0, clockedOutCount: 0 }
    }
  }
}

export async function clockInAttendance({
  employeeIdOrUsername,
  roleType = 'KASIR',
  selfieData,
  notes
}: {
  employeeIdOrUsername: string
  roleType: string
  selfieData?: string
  notes?: string
}) {
  try {
    const trimmed = employeeIdOrUsername.trim()
    if (!trimmed) {
      return { success: false, error: 'ID atau Username Karyawan wajib diisi' }
    }

    // Lookup user in DB
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { username: trimmed },
          { name: { equals: trimmed } }
        ],
        status: 'ACTIVE'
      }
    })

    if (!user) {
      return { success: false, error: `Karyawan ID/Username '${trimmed}' tidak ditemukan atau tidak aktif!` }
    }

    // Check if user already clocked in today without clocking out
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const existingActive = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        clockIn: { gte: todayStart },
        clockOut: null
      }
    })

    if (existingActive) {
      return {
        success: false,
        error: `Karyawan ${user.name} sudah melakukan Absensi Masuk (Clock In) hari ini pada pukul ${new Date(existingActive.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.`
      }
    }

    // Match active shift schedule if any
    const now = new Date()
    const currentMin = now.getHours() * 60 + now.getMinutes()
    const activeSchedules = await prisma.shiftSchedule.findMany({ where: { status: 'ACTIVE' } })
    let matchedScheduleId: string | null = null

    for (const sch of activeSchedules) {
      const [sH, sM] = sch.startTime.split(':').map(Number)
      const [eH, eM] = sch.endTime.split(':').map(Number)
      const startMin = sH * 60 + sM
      const endMin = eH * 60 + eM
      if (startMin < endMin) {
        if (currentMin >= startMin && currentMin < endMin) {
          matchedScheduleId = sch.id
          break
        }
      } else {
        if (currentMin >= startMin || currentMin < endMin) {
          matchedScheduleId = sch.id
          break
        }
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        shiftScheduleId: matchedScheduleId,
        selfieIn: selfieData || null,
        roleType: roleType.toUpperCase(),
        status: 'PRESENT',
        notes: notes || null
      },
      include: {
        user: { select: { name: true, username: true } }
      }
    })

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ATTENDANCE_IN',
        module: 'ATTENDANCE',
        description: `Absensi Masuk (Clock In) Karyawan ${user.name} sebagai ${roleType.toUpperCase()}`
      }
    })

    revalidatePath('/attendance')
    revalidatePath('/kasir')
    return { success: true, attendance: JSON.parse(JSON.stringify(attendance)) }
  } catch (error: any) {
    console.error('Error clocking in attendance:', error)
    return { success: false, error: error.message || 'Gagal menyimpan absensi masuk' }
  }
}

export async function clockOutAttendance(attendanceId: string, selfieData?: string) {
  try {
    const existing = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { user: { select: { name: true } } }
    })

    if (!existing) {
      return { success: false, error: 'Data absensi tidak ditemukan' }
    }

    if (existing.clockOut) {
      return { success: false, error: 'Karyawan ini sudah melakukan Absensi Pulang (Clock Out)' }
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        clockOut: new Date(),
        ...(selfieData && { selfieOut: selfieData })
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: existing.userId,
        action: 'ATTENDANCE_OUT',
        module: 'ATTENDANCE',
        description: `Absensi Pulang (Clock Out) Karyawan ${existing.user.name}`
      }
    })

    revalidatePath('/attendance')
    revalidatePath('/kasir')
    return { success: true, attendance: JSON.parse(JSON.stringify(updated)) }
  } catch (error: any) {
    console.error('Error clocking out attendance:', error)
    return { success: false, error: error.message || 'Gagal menyimpan absensi pulang' }
  }
}
