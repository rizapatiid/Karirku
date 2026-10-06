'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createExpense(formData: FormData) {
  try {
    const description = formData.get('description') as string
    const amount = Number(formData.get('amount'))
    // Simplify for MVP, assume default category or create one
    let category = await prisma.expenseCategory.findFirst()
    if (!category) {
      category = await prisma.expenseCategory.create({ data: { name: 'Operasional' } })
    }

    const user = await prisma.user.findFirst({ where: { username: 'admin' } })
    if (!user) throw new Error('User invalid')

    const expenseNumber = `EXP-${new Date().getTime()}`

    await prisma.$transaction(async (tx) => {
      // 1. Create Expense
      const expense = await tx.expense.create({
        data: {
          expenseNumber,
          categoryId: category!.id,
          userId: user.id,
          amount,
          expenseDate: new Date(),
          description,
          status: 'COMPLETED'
        }
      })

      // 2. Create Cash Transaction
      await tx.cashTransaction.create({
        data: {
          type: 'EXPENSE',
          referenceType: 'EXPENSE',
          referenceId: expense.id,
          amount: amount,
          description: description,
          userId: user.id,
          transactionDate: new Date()
        }
      })
    })

  } catch (error) {
    console.error(error)
    return { error: 'Gagal menyimpan pengeluaran' }
  }

  revalidatePath('/finance')
  redirect('/finance')
}
