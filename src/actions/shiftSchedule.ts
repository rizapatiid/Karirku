'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getShiftSchedules() {
  try {
    const schedules = await prisma.shiftSchedule.findMany({
      orderBy: { createdAt: 'asc' }
    })
    return { success: true, schedules }
  } catch (error) {
    console.error('Error fetching shift schedules:', error)
    return { success: false, error: 'Gagal mengambil data jam kerja shift', schedules: [] }
  }
}

export async function createShiftSchedule(data: {
  name: string
  startTime: string
  endTime: string
  notes?: string
}) {
  try {
    if (!data.name || !data.startTime || !data.endTime) {
      return { success: false, error: 'Nama shift, jam mulai, dan jam selesai wajib diisi' }
    }

    const schedule = await prisma.shiftSchedule.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes || null,
        status: 'ACTIVE'
      }
    })

    revalidatePath('/settings/shifts')
    revalidatePath('/kasir')
    return { success: true, schedule }
  } catch (error) {
    console.error('Error creating shift schedule:', error)
    return { success: false, error: 'Gagal membuat jadwal shift baru' }
  }
}

export async function updateShiftSchedule(
  id: string,
  data: {
    name?: string
    startTime?: string
    endTime?: string
    notes?: string
    status?: 'ACTIVE' | 'INACTIVE'
  }
) {
  try {
    const schedule = await prisma.shiftSchedule.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
      }
    })

    revalidatePath('/settings/shifts')
    revalidatePath('/kasir')
    return { success: true, schedule }
  } catch (error) {
    console.error('Error updating shift schedule:', error)
    return { success: false, error: 'Gagal memperbarui jadwal shift' }
  }
}

export async function deleteShiftSchedule(id: string) {
  try {
    await prisma.shiftSchedule.delete({
      where: { id }
    })

    revalidatePath('/settings/shifts')
    revalidatePath('/kasir')
    return { success: true }
  } catch (error) {
    console.error('Error deleting shift schedule:', error)
    return { success: false, error: 'Gagal menghapus jadwal shift' }
  }
}
