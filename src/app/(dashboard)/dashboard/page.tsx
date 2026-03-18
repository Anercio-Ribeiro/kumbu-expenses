import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getDashboardStats, getMonthlyCashFlow, getGoals } from '@/lib/db/queries'
import { getTopCategories } from '@/lib/db/category-queries'
import { getDebtSummary } from '@/lib/db/debt-loan-queries'
import { getLoanSummary } from '@/lib/db/debt-loan-queries'
import { calcFinancialHealth } from '@/lib/utils/financial-health'
import { PageHeader } from '@/components/ui/page-header'
import { MetricGridSkeleton, ChartSkeleton } from '@/components/ui/skeletons'
import { DashboardClient } from './dashboard-client'

export const metadata: Metadata = { title: 'Dashboard' }

async function DashboardData() {
  const user = await getCurrentUser()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [stats, cashflow, topCats, goals, debtSummary, loanSummary] = await Promise.all([
    getDashboardStats(user.id, year, month),
    getMonthlyCashFlow(user.id, 6),
    getTopCategories(user.id, year, month),
    getGoals(user.id),
    getDebtSummary(user.id),
    getLoanSummary(user.id),
  ])

  const health = calcFinancialHealth(
    stats.totalIncome,
    stats.totalExpenses,
    debtSummary.totalPending,
    0, // monthly debt payments — approximated
    loanSummary.totalPending,
    'pt',
  )

  return (
    <DashboardClient
      stats={stats}
      cashflow={cashflow}
      topCategories={topCats}
      goals={goals}
      userName={user.name.split(' ')[0]}
      debtSummary={{ totalPending: debtSummary.totalPending, overdueCount: debtSummary.overdueCount }}
      loanSummary={{ totalPending: loanSummary.totalPending }}
      health={health}
    />
  )
}

function Greeting() {
  const hour = new Date().getHours()
  const text = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  return (
    <PageHeader
      title={`${text} 👋`}
      subtitle="Aqui está o resumo das tuas finanças"
    />
  )
}

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <Greeting />
      <Suspense fallback={
        <div className="space-y-6">
          <MetricGridSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton height="h-64" />
            <ChartSkeleton height="h-64" />
          </div>
        </div>
      }>
        <DashboardData />
      </Suspense>
    </div>
  )
}
