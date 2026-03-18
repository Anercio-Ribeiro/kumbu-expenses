/**
 * Angola Socioeconomic Income Classification
 *
 * Based on the Angolan economic reality where:
 * - Minimum wage (salário mínimo) ≈ 70,000 Kz/month (2024)
 * - Low income: up to ~300,000 Kz/month
 * - Middle income: 300,000 – 1,500,000 Kz/month
 * - Upper-middle: 1,500,000 – 5,000,000 Kz/month
 * - High income: > 5,000,000 Kz/month
 *
 * These thresholds inform personalised tips without labelling the user.
 */

export type IncomeLevel = 'very_low' | 'low' | 'middle' | 'upper_middle' | 'high'

export function classifyIncome(monthlyIncome: number): IncomeLevel {
  if (monthlyIncome < 150_000) return 'very_low'
  if (monthlyIncome < 350_000) return 'low'
  if (monthlyIncome < 1_500_000) return 'middle'
  if (monthlyIncome < 5_000_000) return 'upper_middle'
  return 'high'
}

export interface BudgetSuggestion {
  needs: number        // % for housing, food, transport, health
  wants: number        // % for leisure, clothing, tech
  savings: number      // % minimum savings
  emergency: number    // months of expenses as emergency fund target
  maxDebtRatio: number // max % of income acceptable for debt payments
  leisureBudget: number // absolute monthly amount for leisure
  savingsBudget: number // absolute monthly amount target
}

export function getBudgetSuggestion(monthlyIncome: number): BudgetSuggestion {
  const level = classifyIncome(monthlyIncome)

  // Percentages adapted to Angolan reality per income level
  const configs: Record<IncomeLevel, Omit<BudgetSuggestion, 'leisureBudget' | 'savingsBudget'>> = {
    very_low: { needs: 80, wants: 10, savings: 10, emergency: 2, maxDebtRatio: 15 },
    low:      { needs: 70, wants: 15, savings: 15, emergency: 3, maxDebtRatio: 20 },
    middle:   { needs: 55, wants: 25, savings: 20, emergency: 4, maxDebtRatio: 25 },
    upper_middle: { needs: 45, wants: 30, savings: 25, emergency: 6, maxDebtRatio: 30 },
    high:     { needs: 35, wants: 30, savings: 35, emergency: 6, maxDebtRatio: 30 },
  }

  const cfg = configs[level]
  return {
    ...cfg,
    leisureBudget: Math.round((monthlyIncome * cfg.wants) / 100),
    savingsBudget: Math.round((monthlyIncome * cfg.savings) / 100),
  }
}

export interface FinancialHealth {
  score: number        // 0–100
  level: 'critical' | 'poor' | 'fair' | 'good' | 'excellent'
  label: string
  color: string
  alerts: string[]
  projections: MonthlyProjection
}

export interface MonthlyProjection {
  projectedBalance: number
  debtBurden: number       // monthly debt payments
  loanReceivable: number   // expected loan repayments
  adjustedBalance: number  // balance after debts + receivables
  canCoverExpenses: boolean
  shortfallAmount: number
  monthsTillBreakeven: number
}

export function calcFinancialHealth(
  monthlyIncome: number,
  monthlyExpenses: number,
  totalPendingDebt: number,
  monthlyDebtPayments: number,
  totalLoansGiven: number,
  locale: 'pt' | 'en' = 'pt',
): FinancialHealth {
  const level = classifyIncome(monthlyIncome)
  const suggestion = getBudgetSuggestion(monthlyIncome)
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
  const debtRatio = monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0
  const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0

  // Score: 100 pts, deduct for problems
  let score = 100
  if (savingsRate < suggestion.savings) score -= Math.min(30, (suggestion.savings - savingsRate) * 1.5)
  if (debtRatio > suggestion.maxDebtRatio) score -= Math.min(25, (debtRatio - suggestion.maxDebtRatio) * 2)
  if (expenseRatio > 90) score -= 20
  if (totalPendingDebt > monthlyIncome * 6) score -= 15
  if (monthlyIncome === 0) score = 0
  score = Math.max(0, Math.round(score))

  const healthLevel: FinancialHealth['level'] =
    score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : score >= 20 ? 'poor' : 'critical'

  const labels = {
    pt: { excellent: 'Excelente', good: 'Boa', fair: 'Razoável', poor: 'Fraca', critical: 'Crítica' },
    en: { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Poor', critical: 'Critical' },
  }
  const colors = { excellent: '#3ecf8e', good: '#5b8ff9', fair: '#e8b84b', poor: '#ff8c42', critical: '#f26060' }

  // Alerts
  const alerts: string[] = []
  const a = locale === 'pt' ? {
    highDebt: `As tuas prestações de dívidas (${debtRatio.toFixed(0)}%) excedem o limite recomendado de ${suggestion.maxDebtRatio}% da renda`,
    lowSavings: `A tua taxa de poupança (${savingsRate.toFixed(0)}%) está abaixo da meta de ${suggestion.savings}% recomendada para o teu nível de renda`,
    highExpenses: `As despesas consomem mais de 90% da tua renda — margem muito estreita`,
    highDebtTotal: `O total em dívidas representa mais de 6 meses de renda`,
    loansRisk: `Tens ${locale === 'pt' ? 'empréstimos concedidos' : 'loans given'} por receber que afectam a liquidez`,
  } : {
    highDebt: `Your debt payments (${debtRatio.toFixed(0)}%) exceed the recommended ${suggestion.maxDebtRatio}% limit`,
    lowSavings: `Your savings rate (${savingsRate.toFixed(0)}%) is below the recommended ${suggestion.savings}% target`,
    highExpenses: `Expenses consume over 90% of income — very tight margin`,
    highDebtTotal: `Total debt represents more than 6 months of income`,
    loansRisk: `You have outstanding loans that affect your liquidity`,
  }

  if (debtRatio > suggestion.maxDebtRatio) alerts.push(a.highDebt)
  if (savingsRate < suggestion.savings) alerts.push(a.lowSavings)
  if (expenseRatio > 90) alerts.push(a.highExpenses)
  if (totalPendingDebt > monthlyIncome * 6) alerts.push(a.highDebtTotal)
  if (totalLoansGiven > monthlyIncome * 2) alerts.push(a.loansRisk)

  // Projections
  const projectedBalance = monthlyIncome - monthlyExpenses
  const adjustedBalance = projectedBalance - monthlyDebtPayments
  const canCoverExpenses = adjustedBalance >= 0
  const shortfallAmount = Math.max(0, -adjustedBalance)
  const monthsTillBreakeven = shortfallAmount > 0 && projectedBalance > 0
    ? Math.ceil(shortfallAmount / projectedBalance) : 0

  return {
    score,
    level: healthLevel,
    label: labels[locale][healthLevel],
    color: colors[healthLevel],
    alerts,
    projections: {
      projectedBalance,
      debtBurden: monthlyDebtPayments,
      loanReceivable: totalLoansGiven,
      adjustedBalance,
      canCoverExpenses,
      shortfallAmount,
      monthsTillBreakeven,
    },
  }
}
