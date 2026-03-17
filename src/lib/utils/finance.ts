import { differenceInMonths, differenceInDays, format, addMonths } from 'date-fns'
import { pt } from 'date-fns/locale'

// ─── Currency Formatting ──────────────────────────────────────────────────────
/**
 * Format a number as Angolan Kwanza.
 * Uses pt-AO locale — outputs: 1.234.567 Kz
 */
export function formatKz(value: number | string, opts?: { compact?: boolean }): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(n)) return '0 Kz'

  if (opts?.compact) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace('.', ',')} Mil M Kz`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace('.', ',')} M Kz`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k Kz`
  }

  return new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n) + ' Kz'
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
}

// ─── Percentage Calculations ──────────────────────────────────────────────────
/** Savings rate: what % of income is saved */
export function calcSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0
  const rate = ((income - expenses) / income) * 100
  return Math.round(rate * 100) / 100 // 2 decimal places
}

/** Percentage change between two periods */
export function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100 * 10) / 10
}

/** What % of a total is a value */
export function calcShare(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100 * 100) / 100
}

// ─── Goal Projections ─────────────────────────────────────────────────────────
export interface GoalProjection {
  progressPct: number          // 0–100
  remaining: number            // how much left to save
  monthsNeeded: number         // at current savings rate
  projectedDate: Date          // when goal will be reached
  monthsToTarget: number       // months until target date
  isOnTrack: boolean
  requiredMonthly: number      // monthly amount needed to reach target in time
  currentMonthly: number       // current monthly savings
  daysLeft: number
}

export function calcGoalProjection(
  targetAmount: number,
  currentAmount: number,
  targetDate: Date,
  currentMonthlySavings: number, // actual savings per month
): GoalProjection {
  const remaining = Math.max(targetAmount - currentAmount, 0)
  const progressPct = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0
  const today = new Date()
  const monthsToTarget = Math.max(differenceInMonths(targetDate, today), 0)
  const daysLeft = Math.max(differenceInDays(targetDate, today), 0)
  const monthsNeeded = currentMonthlySavings > 0 ? Math.ceil(remaining / currentMonthlySavings) : 9999
  const projectedDate = addMonths(today, monthsNeeded)
  const requiredMonthly = monthsToTarget > 0 ? Math.ceil(remaining / monthsToTarget) : remaining
  const isOnTrack = currentMonthlySavings >= requiredMonthly

  return {
    progressPct: Math.round(progressPct * 10) / 10,
    remaining: Math.round(remaining),
    monthsNeeded,
    projectedDate,
    monthsToTarget,
    isOnTrack,
    requiredMonthly: Math.round(requiredMonthly),
    currentMonthly: Math.round(currentMonthlySavings),
    daysLeft,
  }
}

// ─── Savings Simulator ────────────────────────────────────────────────────────
export interface SavingsSimulation {
  monthlyAmount: number
  annualAmount: number
  in3Years: number
  in5Years: number
  in10Years: number
  monthsForCar: number       // default car goal 18M Kz
  yearsForCar: number
}

export function simulateSavings(income: number, savingsPct: number): SavingsSimulation {
  const monthly = (income * savingsPct) / 100
  const annual = monthly * 12
  const carTarget = 18_000_000

  return {
    monthlyAmount: Math.round(monthly),
    annualAmount: Math.round(annual),
    in3Years: Math.round(monthly * 36),
    in5Years: Math.round(monthly * 60),
    in10Years: Math.round(monthly * 120),
    monthsForCar: monthly > 0 ? Math.ceil(carTarget / monthly) : 9999,
    yearsForCar: monthly > 0 ? Number((carTarget / (monthly * 12)).toFixed(1)) : 999,
  }
}

// ─── 50/30/20 Rule ────────────────────────────────────────────────────────────
export function calc503020(income: number) {
  return {
    needs: Math.round(income * 0.5),       // necessidades
    wants: Math.round(income * 0.3),       // desejos
    savings: Math.round(income * 0.2),     // poupanças
  }
}

// ─── Statistics ───────────────────────────────────────────────────────────────
export function calcDescriptiveStats(values: number[]) {
  if (values.length === 0) return null
  const n = values.length
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((a, b) => a + b, 0) / n
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0
  const q1 = sorted[Math.floor(n * 0.25)]
  const q3 = sorted[Math.floor(n * 0.75)]

  return {
    mean: Math.round(mean),
    median: Math.round(median),
    stdDev: Math.round(stdDev),
    variance: Math.round(variance),
    min: sorted[0],
    max: sorted[n - 1],
    q1: Math.round(q1),
    q3: Math.round(q3),
    iqr: Math.round(q3 - q1),
    cv: Math.round(cv * 10) / 10,
    count: n,
    sum: Math.round(values.reduce((a, b) => a + b, 0)),
  }
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────
export function formatDatePT(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: pt })
}

export function formatMonthPT(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMMM yyyy', { locale: pt })
}

export function getChildAge(birthDate: Date | string): { years: number; months: number; label: string } {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  const totalMonths = differenceInMonths(today, birth)
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const label = years > 0
    ? `${years} ano${years !== 1 ? 's' : ''}${months > 0 ? ` e ${months} ${months === 1 ? 'mês' : 'meses'}` : ''}`
    : `${months} ${months === 1 ? 'mês' : 'meses'}`
  return { years, months, label }
}

// ─── Category meta ────────────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = {
  food: { label: 'Alimentação', icon: '🍽️', color: '#f26060', colorDark: '#f28080' },
  transport: { label: 'Transporte', icon: '🚗', color: '#5b8ff9', colorDark: '#7ba4fa' },
  health: { label: 'Saúde', icon: '💊', color: '#3ecf8e', colorDark: '#5dd9a2' },
  leisure: { label: 'Lazer', icon: '🎬', color: '#9c7aff', colorDark: '#b59aff' },
  education: { label: 'Educação', icon: '📚', color: '#ff8c42', colorDark: '#ffa366' },
  housing: { label: 'Casa', icon: '🏠', color: '#e8b84b', colorDark: '#f0cc70' },
  clothing: { label: 'Vestuário', icon: '👕', color: '#ff6b9d', colorDark: '#ff8fb5' },
  technology: { label: 'Tecnologia', icon: '💻', color: '#00d4ff', colorDark: '#33dbff' },
  children: { label: 'Filhos', icon: '👶', color: '#ff9f43', colorDark: '#ffb86c' },
  savings: { label: 'Poupanças', icon: '💰', color: '#1dd1a1', colorDark: '#55ddb7' },
  credit: { label: 'Crédito', icon: '🏦', color: '#e879f9', colorDark: '#f0abfc' },
  other: { label: 'Outros', icon: '📦', color: '#8b91a8', colorDark: '#a8aec2' },
} as const

export const INCOME_CATEGORIES = {
  salary: { label: 'Salário', icon: '💼', color: '#3ecf8e' },
  freelance: { label: 'Freelance', icon: '💻', color: '#5b8ff9' },
  business: { label: 'Negócio', icon: '🏢', color: '#e8b84b' },
  investment: { label: 'Investimento', icon: '📈', color: '#9c7aff' },
  rental: { label: 'Aluguer', icon: '🏘️', color: '#ff8c42' },
  other: { label: 'Outro', icon: '💰', color: '#8b91a8' },
} as const

export type ExpenseCategory = keyof typeof EXPENSE_CATEGORIES
export type IncomeCategory = keyof typeof INCOME_CATEGORIES
