import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as xlsx from 'xlsx'

export async function GET() {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Laba Kotor Penjualan Bulan Ini
    const sales = await prisma.sale.findMany({
      where: { transactionDate: { gte: startOfMonth }, status: 'COMPLETED' },
      include: { items: true }
    })

    let totalRevenue = 0
    let totalHPP = 0
    sales.forEach(sale => {
      totalRevenue += Number(sale.total)
      sale.items.forEach(item => {
        totalHPP += (Number(item.costPrice) * item.quantity)
      })
    })

    const grossProfit = totalRevenue - totalHPP

    // Pengeluaran Bulan Ini
    const expenses = await prisma.expense.aggregate({
      where: { expenseDate: { gte: startOfMonth } },
      _sum: { amount: true }
    })
    const totalExpenses = Number(expenses._sum.amount || 0)

    const netProfit = grossProfit - totalExpenses

    // Formatting for Excel
    const excelData = [
      { Kategori: 'Total Pendapatan (Omzet)', Nominal: totalRevenue },
      { Kategori: 'Total Harga Pokok (HPP)', Nominal: totalHPP },
      { Kategori: 'Laba Kotor (Gross Profit)', Nominal: grossProfit },
      { Kategori: 'Total Pengeluaran (Beban)', Nominal: totalExpenses },
      { Kategori: 'Laba Bersih (Net Profit)', Nominal: netProfit }
    ]

    const worksheet = xlsx.utils.json_to_sheet(excelData)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Laba Rugi Bulanan')

    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Laba_Rugi_${startOfMonth.getMonth()+1}_${startOfMonth.getFullYear()}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal men-generate laporan' }, { status: 500 })
  }
}
