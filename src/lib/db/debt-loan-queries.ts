import { db } from './index'
import { debts, loans, expenses, incomes } from './schema'
import { eq, and, desc, sum, count, ne } from 'drizzle-orm'

// ─── Debts ────────────────────────────────────────────────────────────────────
export async function getDebts(userId: string) {
  return db.query.debts.findMany({
    where: eq(debts.userId, userId),
    orderBy: [desc(debts.createdAt)],
  })
}

export async function getDebtSummary(userId: string) {
  const all = await getDebts(userId)
  const pending = all.filter(d => d.status === 'pending' || d.status === 'overdue')
  const settled = all.filter(d => d.status === 'settled')
  const totalPending = pending.reduce((s, d) => s + Number(d.remainingAmount), 0)
  const totalSettled = settled.reduce((s, d) => s + Number(d.originalAmount), 0)
  const overdueCount = all.filter(d => d.status === 'overdue').length
  return { all, pending, settled, totalPending, totalSettled, overdueCount }
}

export async function createDebt(userId: string, data: {
  description: string
  creditor: string
  originalAmount: number
  dueDate?: Date
  notes?: string
}) {
  const [debt] = await db.insert(debts).values({
    userId,
    description: data.description,
    creditor: data.creditor,
    originalAmount: data.originalAmount.toFixed(2),
    remainingAmount: data.originalAmount.toFixed(2),
    dueDate: data.dueDate,
    notes: data.notes,
    status: 'pending',
  }).returning()
  return debt
}

/**
 * Settle a debt — marks as settled AND auto-creates an expense.
 */
export async function settleDebt(debtId: string, userId: string, partialAmount?: number) {
  const debt = await db.query.debts.findFirst({
    where: and(eq(debts.id, debtId), eq(debts.userId, userId)),
  })
  if (!debt) throw new Error('Dívida não encontrada')

  const amount = partialAmount ?? Number(debt.remainingAmount)

  // Auto-create expense
  const [expense] = await db.insert(expenses).values({
    userId,
    description: `Pagamento de dívida — ${debt.description} (${debt.creditor})`,
    category: 'other',
    amount: amount.toFixed(2),
    spentAt: new Date(),
    notes: `Quitação de dívida a ${debt.creditor}`,
    isRecurring: false,
  }).returning()

  const newRemaining = Math.max(Number(debt.remainingAmount) - amount, 0)
  const isFullySettled = newRemaining === 0

  await db.update(debts).set({
    remainingAmount: newRemaining.toFixed(2),
    status: isFullySettled ? 'settled' : 'pending',
    settledAt: isFullySettled ? new Date() : null,
    settledExpenseId: isFullySettled ? expense.id : undefined,
    updatedAt: new Date(),
  }).where(eq(debts.id, debtId))

  return { expense, settled: isFullySettled }
}

export async function deleteDebt(debtId: string, userId: string) {
  await db.delete(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
}

// ─── Loans ────────────────────────────────────────────────────────────────────
export async function getLoans(userId: string) {
  return db.query.loans.findMany({
    where: eq(loans.userId, userId),
    orderBy: [desc(loans.createdAt)],
  })
}

export async function getLoanSummary(userId: string) {
  const all = await getLoans(userId)
  const pending = all.filter(l => l.status === 'pending' || l.status === 'partial')
  const repaid = all.filter(l => l.status === 'repaid')
  const totalPending = pending.reduce((s, l) => s + Number(l.originalAmount) - Number(l.repaidAmount), 0)
  const totalRepaid = all.reduce((s, l) => s + Number(l.repaidAmount), 0)
  const totalLent = all.reduce((s, l) => s + Number(l.originalAmount), 0)
  return { all, pending, repaid, totalPending, totalRepaid, totalLent }
}

/**
 * Create a loan — also auto-creates an expense (money leaving the user).
 */
export async function createLoan(userId: string, data: {
  description: string
  borrower: string
  originalAmount: number
  dueDate?: Date
  notes?: string
}) {
  // Create expense first
  const [expense] = await db.insert(expenses).values({
    userId,
    description: `Empréstimo concedido a ${data.borrower} — ${data.description}`,
    category: 'other',
    amount: data.originalAmount.toFixed(2),
    spentAt: new Date(),
    notes: data.notes,
    isRecurring: false,
  }).returning()

  const [loan] = await db.insert(loans).values({
    userId,
    description: data.description,
    borrower: data.borrower,
    originalAmount: data.originalAmount.toFixed(2),
    repaidAmount: '0',
    dueDate: data.dueDate,
    notes: data.notes,
    status: 'pending',
  }).returning()

  return { loan, expense }
}

/**
 * Register a repayment — auto-creates an income entry.
 */
export async function repayLoan(loanId: string, userId: string, amount: number, notes?: string) {
  const loan = await db.query.loans.findFirst({
    where: and(eq(loans.id, loanId), eq(loans.userId, userId)),
  })
  if (!loan) throw new Error('Empréstimo não encontrado')

  // Auto-create income
  const [income] = await db.insert(incomes).values({
    userId,
    description: `Devolução de empréstimo — ${loan.borrower} (${loan.description})`,
    category: 'other',
    amount: amount.toFixed(2),
    period: 'once',
    receivedAt: new Date(),
    notes: notes ?? `Devolução de ${loan.borrower}`,
    isRecurring: false,
  }).returning()

  const newRepaid = Math.min(Number(loan.repaidAmount) + amount, Number(loan.originalAmount))
  const isFullyRepaid = newRepaid >= Number(loan.originalAmount)

  await db.update(loans).set({
    repaidAmount: newRepaid.toFixed(2),
    status: isFullyRepaid ? 'repaid' : 'partial',
    updatedAt: new Date(),
  }).where(eq(loans.id, loanId))

  return { income, repaid: isFullyRepaid }
}

export async function deleteLoan(loanId: string, userId: string) {
  await db.delete(loans).where(and(eq(loans.id, loanId), eq(loans.userId, userId)))
}
