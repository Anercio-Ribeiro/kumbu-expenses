import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getLoanSummary } from '@/lib/db/debt-loan-queries'
import { getDashboardStats } from '@/lib/db/queries'
import { PageHeader } from '@/components/ui/page-header'
import { LoansClient } from './loans-client'

export const metadata: Metadata = { title: 'Empréstimos Concedidos' }

async function LoansData() {
  const user = await getCurrentUser()
  const now = new Date()
  const [summary, stats] = await Promise.all([
    getLoanSummary(user.id),
    getDashboardStats(user.id, now.getFullYear(), now.getMonth() + 1),
  ])
  return (
    <LoansClient
      initialLoans={summary.all as any[]}
      totalPending={summary.totalPending}
      monthlyIncome={stats.totalIncome}
    />
  )
}

export default function LoansPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Empréstimos Concedidos"
        subtitle="Regista valores que emprestaste — deduzidos do teu saldo, devolvidos como renda"
      />
      <Suspense fallback={<div className="space-y-4">{[1,2].map(i=><div key={i} className="kanza-card h-32 animate-pulse"/>)}</div>}>
        <LoansData />
      </Suspense>
    </div>
  )
}
