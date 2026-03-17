import { db } from './index'
import { credits, expenses, incomes } from './schema'
import { eq, and, sum, desc } from 'drizzle-orm'

export async function getCredits(userId: string) {
  return db.query.credits.findMany({
    where: eq(credits.userId, userId),
    orderBy: [desc(credits.createdAt)],
  })
}

export async function getCreditWithPayments(creditId: string, userId: string) {
  const credit = await db.query.credits.findFirst({
    where: and(eq(credits.id, creditId), eq(credits.userId, userId)),
  })
  if (!credit) return null

  // All expense rows tagged to this credit (standard + amortizations)
  const payments = await db.query.expenses.findMany({
    where: and(eq(expenses.creditId, creditId), eq(expenses.userId, userId)),
    orderBy: [desc(expenses.spentAt)],
  })

  return { ...credit, payments }
}

export async function getMonthlySalary(userId: string): Promise<number> {
  // Sum of all salary-category recurring incomes as monthly proxy
  const result = await db
    .select({ total: sum(incomes.amount) })
    .from(incomes)
    .where(and(eq(incomes.userId, userId), eq(incomes.category, 'salary')))
  return Number(result[0]?.total ?? 0)
}
