import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as xlsx from 'xlsx'

export async function GET() {
  try {
    const movements = await prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        user: true
      }
    })

    const excelData = movements.map(mov => ({
      'Tanggal': mov.createdAt.toLocaleString('id-ID'),
      'SKU': mov.product.sku,
      'Nama Produk': mov.product.name,
      'Kasir/Admin': mov.user.name,
      'Tipe Pergerakan': mov.type,
      'Qty (Perubahan)': mov.quantity,
      'Stok Awal': mov.stockBefore,
      'Stok Akhir': mov.stockAfter,
      'Catatan': mov.note || '-'
    }))

    const worksheet = xlsx.utils.json_to_sheet(excelData)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Laporan Stok')

    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Laporan_Stok_KASIRKU.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal men-generate laporan' }, { status: 500 })
  }
}
