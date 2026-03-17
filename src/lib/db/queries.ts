import { db } from './index'
import { incomes, expenses, children, goals, goalContributions, budgets, users } from './schema'
import { eq, and, gte, lte, sql, desc, sum, count, between } from 'drizzle-orm'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

// ─── Users ─────────────────────────────────────────────────────────────────
export async function getUserById(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) })
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) })
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────
export async function getDashboardStats(userId: string, year: number, month: number) {
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(new Date(year, month - 1))
  const prevStart = startOfMonth(subMonths(start, 1))
  const prevEnd = endOfMonth(subMonths(start, 1))

  const [currentIncome, prevIncome, currentExpenses, prevExpenses] = await Promise.all([
    db.select({ total: sum(incomes.amount) })
      .from(incomes)
      .where(and(eq(incomes.userId, userId), between(incomes.receivedAt, start, end))),
    db.select({ total: sum(incomes.amount) })
      .from(incomes)
      .where(and(eq(incomes.userId, userId), between(incomes.receivedAt, prevStart, prevEnd))),
    db.select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), between(expenses.spentAt, start, end))),
    db.select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), between(expenses.spentAt, prevStart, prevEnd))),
  ])

  const totalIncome = Number(currentIncome[0]?.total ?? 0)
  const totalExpenses = Number(currentExpenses[0]?.total ?? 0)
  const prevIncomeVal = Number(prevIncome[0]?.total ?? 0)
  const prevExpensesVal = Number(prevExpenses[0]?.total ?? 0)
  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0
  const incomeChange = prevIncomeVal > 0 ? (((totalIncome - prevIncomeVal) / prevIncomeVal) * 100) : 0
  const expensesChange = prevExpensesVal > 0 ? (((totalExpenses - prevExpensesVal) / prevExpensesVal) * 100) : 0

  return { totalIncome, totalExpenses, balance, savingsRate, incomeChange, expensesChange }
}

// ─── Monthly Cash Flow (6 months) ───────────────────────────────────────────
export async function getMonthlyCashFlow(userId: string, months = 6) {
  const result = []
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i)
    const start = startOfMonth(date)
    const end = endOfMonth(date)

    const [inc, exp] = await Promise.all([
      db.select({ total: sum(incomes.amount) })
        .from(incomes)
        .where(and(eq(incomes.userId, userId), between(incomes.receivedAt, start, end))),
      db.select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(eq(expenses.userId, userId), between(expenses.spentAt, start, end))),
    ])

    const income = Number(inc[0]?.total ?? 0)
    const expense = Number(exp[0]?.total ?? 0)
    result.push({
      month: format(date, 'MMM', { locale: undefined }),
      monthFull: format(date, 'MMMM yyyy'),
      income,
      expense,
      balance: income - expense,
      savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
    })
  }
  return result
}

// ─── Expenses by Category ────────────────────────────────────────────────────
export async function getExpensesByCategory(userId: string, year: number, month: number) {
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(new Date(year, month - 1))

  return db
    .select({
      category: expenses.category,
      total: sum(expenses.amount),
      count: count(),
    })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), between(expenses.spentAt, start, end)))
    .groupBy(expenses.category)
    .orderBy(desc(sum(expenses.amount)))
}

// ─── Income list ─────────────────────────────────────────────────────────────
export async function getIncomes(userId: string, limit = 50) {
  return db.query.incomes.findMany({
    where: eq(incomes.userId, userId),
    orderBy: [desc(incomes.receivedAt)],
    limit,
  })
}

// ─── Expense list ─────────────────────────────────────────────────────────────
export async function getExpenses(
  userId: string,
  filters?: { category?: string; childId?: string; year?: number; month?: number },
  limit = 100,
) {
  const conditions = [eq(expenses.userId, userId)]
  if (filters?.category) conditions.push(eq(expenses.category, filters.category as never))
  if (filters?.childId) conditions.push(eq(expenses.childId, filters.childId))
  if (filters?.year && filters?.month) {
    const start = startOfMonth(new Date(filters.year, filters.month - 1))
    const end = endOfMonth(new Date(filters.year, filters.month - 1))
    conditions.push(between(expenses.spentAt, start, end))
  }

  return db.query.expenses.findMany({
    where: and(...conditions),
    orderBy: [desc(expenses.spentAt)],
    with: { child: true },
    limit,
  })
}

// ─── Children ─────────────────────────────────────────────────────────────────
export async function getChildren(userId: string) {
  return db.query.children.findMany({
    where: eq(children.userId, userId),
    orderBy: [children.name],
  })
}

export async function getChildWithStats(childId: string, userId: string) {
  const child = await db.query.children.findFirst({
    where: and(eq(children.id, childId), eq(children.userId, userId)),
  })
  if (!child) return null

  const totalSpent = await db
    .select({ total: sum(expenses.amount) })
    .from(expenses)
    .where(and(eq(expenses.childId, childId), eq(expenses.userId, userId)))

  const byCategory = await db
    .select({ category: expenses.category, total: sum(expenses.amount), count: count() })
    .from(expenses)
    .where(and(eq(expenses.childId, childId), eq(expenses.userId, userId)))
    .groupBy(expenses.category)

  const childGoals = await db.query.goals.findMany({
    where: and(eq(goals.childId, childId), eq(goals.userId, userId)),
  })

  return { ...child, totalSpent: Number(totalSpent[0]?.total ?? 0), byCategory, goals: childGoals }
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export async function getGoals(userId: string) {
  return db.query.goals.findMany({
    where: eq(goals.userId, userId),
    with: { child: true, contributions: { orderBy: [desc(goalContributions.contributedAt)], limit: 5 } },
    orderBy: [goals.targetDate],
  })
}

export async function addGoalContribution(goalId: string, userId: string, amount: number, notes?: string) {
  // Use a transaction to update both tables atomically
  await db.insert(goalContributions).values({
    goalId,
    userId,
    amount: amount.toFixed(2),
    notes,
  })
  await db
    .update(goals)
    .set({
      currentAmount: sql`${goals.currentAmount} + ${amount.toFixed(2)}`,
      updatedAt: new Date(),
    })
    .where(eq(goals.id, goalId))
}

// ─── Statistics ───────────────────────────────────────────────────────────────
export async function getFullStatistics(userId: string) {
  const now = new Date()
  const sixMonthsAgo = subMonths(startOfMonth(now), 5)

  const [allExpenses, allIncomes, topExpenses] = await Promise.all([
    db.select({ amount: expenses.amount, category: expenses.category, spentAt: expenses.spentAt })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), gte(expenses.spentAt, sixMonthsAgo))),
    db.select({ amount: incomes.amount, receivedAt: incomes.receivedAt })
      .from(incomes)
      .where(and(eq(incomes.userId, userId), gte(incomes.receivedAt, sixMonthsAgo))),
    db.select({ description: expenses.description, amount: expenses.amount, spentAt: expenses.spentAt, category: expenses.category })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.amount))
      .limit(5),
  ])

  const expenseAmounts = allExpenses.map(e => Number(e.amount))
  const n = expenseAmounts.length
  if (n === 0) return null

  const mean = expenseAmounts.reduce((a, b) => a + b, 0) / n
  const sorted = [...expenseAmounts].sort((a, b) => a - b)
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]
  const variance = expenseAmounts.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)
  const totalIncome = allIncomes.reduce((a, b) => a + Number(b.amount), 0)
  const totalExpenses = expenseAmounts.reduce((a, b) => a + b, 0)

  return {
    mean: Math.round(mean),
    median: Math.round(median),
    stdDev: Math.round(stdDev),
    min: Math.round(Math.min(...expenseAmounts)),
    max: Math.round(Math.max(...expenseAmounts)),
    totalIncome: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    balance: Math.round(totalIncome - totalExpenses),
    savingsRate: totalIncome > 0 ? Number(((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2)) : 0,
    coefficientOfVariation: mean > 0 ? Number(((stdDev / mean) * 100).toFixed(1)) : 0,
    count: n,
    topExpenses,
  }
}

// ─── Budgets ─────────────────────────────────────────────────────────────────
export async function getBudgets(userId: string, year: number, month: number) {
  return db.query.budgets.findMany({
    where: and(eq(budgets.userId, userId), eq(budgets.year, year), eq(budgets.month, month)),
  })
}
