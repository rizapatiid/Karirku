import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as xlsx from 'xlsx'

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { transactionDate: 'desc' },
      include: {
        user: true,
        customer: true,
        items: { include: { product: true } }
      }
    })

    // Flatten data for Excel
    const excelData = sales.map(sale => ({
      'No. Invoice': sale.invoiceNumber,
      'Tanggal': sale.transactionDate.toLocaleString('id-ID'),
      'Kasir': sale.user.name,
      'Pelanggan': sale.customer?.name || 'Umum',
      'Total Item': sale.items.reduce((acc, curr) => acc + curr.quantity, 0),
      'Subtotal': Number(sale.subtotal),
      'Diskon': Number(sale.discount),
      'Total Bayar': Number(sale.total),
      'Status': sale.status
    }))

    const worksheet = xlsx.utils.json_to_sheet(excelData)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Laporan Penjualan')

    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Laporan_Penjualan_KASIRKU.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal men-generate laporan' }, { status: 500 })
  }
}
