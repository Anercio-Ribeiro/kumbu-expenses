import { differenceInDays, differenceInMonths, addMonths, format, isAfter } from 'date-fns'
import { pt } from 'date-fns/locale'
import { formatKz } from './finance'

export interface CreditSummary {
  // Inputs
  totalAmount: number
  monthlyPayment: number
  totalMonths: number
  startDate: Date

  // Computed from start date + extra payments
  monthsElapsed: number            // how many months have passed since start
  daysElapsed: number
  monthsRemaining: number          // totalMonths - monthsElapsed (capped at 0)
  daysRemaining: number
  yearsRemaining: number           // decimal, e.g. 2.5

  // Payments
  standardPaid: number             // monthsElapsed × monthlyPayment (standard schedule)
  extraPaid: number                // sum of amortization payments above monthly
  totalPaid: number                // standardPaid + extraPaid
  totalRemaining: number           // totalAmount - totalPaid (capped at 0)
  progressPct: number              // totalPaid / totalAmount × 100

  // Impact on salary
  salaryImpactPct: number          // monthlyPayment / monthlySalary × 100
  monthlySalary: number

  // Projected end date (adjusted for extra payments)
  projectedEndDate: Date
  scheduledEndDate: Date           // startDate + totalMonths
  isAheadOfSchedule: boolean

  // Human-readable remaining time
  remainingLabel: string
  status: 'active' | 'paid' | 'paused'
}

export interface AmortizationRow {
  month: number
  date: Date
  payment: number         // standard monthly
  extra: number           // extra payment that month (0 if none)
  total: number           // payment + extra
  remaining: number       // balance after this payment
  isPast: boolean
  isCurrent: boolean
}

/**
 * Calculate full credit summary.
 * extraPayments = list of {amount, date} for any amortization above monthly.
 */
export function calcCreditSummary(
  totalAmount: number,
  monthlyPayment: number,
  totalMonths: number,
  startDate: Date,
  extraPayments: Array<{ amount: number; date: Date }> = [],
  monthlySalary = 0,
  status: 'active' | 'paid' | 'paused' = 'active',
): CreditSummary {
  const today = new Date()
  const daysElapsed = Math.max(differenceInDays(today, startDate), 0)
  const monthsElapsed = Math.min(
    Math.max(differenceInMonths(today, startDate), 0),
    totalMonths,
  )

  const standardPaid = Math.min(monthsElapsed * monthlyPayment, totalAmount)
  const extraPaid = extraPayments.reduce((s, p) => s + p.amount, 0)
  const totalPaid = Math.min(standardPaid + extraPaid, totalAmount)
  const totalRemaining = Math.max(totalAmount - totalPaid, 0)
  const progressPct = totalAmount > 0 ? Math.min((totalPaid / totalAmount) * 100, 100) : 0

  const scheduledEndDate = addMonths(startDate, totalMonths)

  // Projected end: remaining balance ÷ monthly payment
  const monthsNeeded = monthlyPayment > 0 ? Math.ceil(totalRemaining / monthlyPayment) : 0
  const projectedEndDate = addMonths(today, monthsNeeded)

  const monthsRemaining = Math.max(totalMonths - monthsElapsed, 0)
  const daysRemaining = Math.max(differenceInDays(projectedEndDate, today), 0)
  const yearsRemaining = Number((daysRemaining / 365).toFixed(2))

  const isAheadOfSchedule = isAfter(scheduledEndDate, projectedEndDate)

  const salaryImpactPct = monthlySalary > 0
    ? Math.round((monthlyPayment / monthlySalary) * 100 * 100) / 100
    : 0

  // Build human-readable remaining label
  const yrR = Math.floor(daysRemaining / 365)
  const moR = Math.floor((daysRemaining % 365) / 30)
  const parts: string[] = []
  if (yrR > 0) parts.push(`${yrR} ano${yrR !== 1 ? 's' : ''}`)
  if (moR > 0) parts.push(`${moR} ${moR === 1 ? 'mês' : 'meses'}`)
  if (parts.length === 0) parts.push(`${daysRemaining} dias`)
  const remainingLabel = parts.join(' e ')

  return {
    totalAmount, monthlyPayment, totalMonths, startDate,
    monthsElapsed, daysElapsed, monthsRemaining, daysRemaining, yearsRemaining,
    standardPaid: Math.round(standardPaid),
    extraPaid: Math.round(extraPaid),
    totalPaid: Math.round(totalPaid),
    totalRemaining: Math.round(totalRemaining),
    progressPct: Math.round(progressPct * 10) / 10,
    salaryImpactPct, monthlySalary,
    scheduledEndDate, projectedEndDate,
    isAheadOfSchedule,
    remainingLabel,
    status,
  }
}

/**
 * Build full amortization schedule table.
 */
export function buildAmortizationSchedule(
  totalAmount: number,
  monthlyPayment: number,
  totalMonths: number,
  startDate: Date,
  extraPayments: Array<{ amount: number; date: Date }> = [],
): AmortizationRow[] {
  const today = new Date()
  let balance = totalAmount
  const rows: AmortizationRow[] = []

  for (let i = 0; i < totalMonths; i++) {
    const date = addMonths(startDate, i)
    const payment = Math.min(monthlyPayment, balance)

    // Sum extra payments in this month
    const monthKey = format(date, 'yyyy-MM')
    const extra = extraPayments
      .filter(p => format(p.date, 'yyyy-MM') === monthKey)
      .reduce((s, p) => s + p.amount, 0)

    const totalPayment = payment + extra
    balance = Math.max(balance - totalPayment, 0)

    const isPast = isAfter(today, date)
    const isCurrent = format(today, 'yyyy-MM') === format(date, 'yyyy-MM')

    rows.push({ month: i + 1, date, payment, extra, total: totalPayment, remaining: balance, isPast, isCurrent })

    if (balance <= 0) break
  }

  return rows
}

/**
 * Build salary impact explanation string.
 */
export function creditSalaryImpactLabel(pct: number): { label: string; severity: 'safe' | 'warning' | 'danger' } {
  if (pct <= 20) return { label: 'Saudável — dentro do limite recomendado de 20% do salário', severity: 'safe' }
  if (pct <= 30) return { label: 'Moderado — acima do ideal; reduz margem para poupança', severity: 'warning' }
  return { label: 'Elevado — compromete mais de 30% do salário; risco de desequilíbrio', severity: 'danger' }
}
