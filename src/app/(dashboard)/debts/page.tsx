import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getDebtSummary } from '@/lib/db/debt-loan-queries'
import { getDashboardStats } from '@/lib/db/queries'
import { PageHeader } from '@/components/ui/page-header'
import { DebtsClient } from './debts-client'

export const metadata: Metadata = { title: 'Dívidas' }

async function DebtsData() {
  const user = await getCurrentUser()
  const now = new Date()
  const [summary, stats] = await Promise.all([
    getDebtSummary(user.id),
    getDashboardStats(user.id, now.getFullYear(), now.getMonth() + 1),
  ])
  return (
    <DebtsClient
      initialDebts={summary.all as any[]}
      totalPending={summary.totalPending}
      monthlyIncome={stats.totalIncome}
    />
  )
}

export default function DebtsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dívidas"
        subtitle="Regista o que deves e quita as dívidas com um clique — gera automaticamente uma despesa"
      />
      <Suspense fallback={<div className="space-y-4">{[1,2,3].map(i=><div key={i} className="kanza-card h-32 animate-pulse"/>)}</div>}>
        <DebtsData />
      </Suspense>
    </div>
  )
}
