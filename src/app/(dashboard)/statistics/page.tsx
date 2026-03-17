import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getFullStatistics, getMonthlyCashFlow } from '@/lib/db/queries'
import { PageHeader } from '@/components/ui/page-header'
import { MetricGridSkeleton } from '@/components/ui/skeletons'
import { StatisticsClient } from './statistics-client'

export const metadata: Metadata = { title: 'Estatísticas' }

async function StatsData() {
  const user = await getCurrentUser()
  const [stats, cashflow] = await Promise.all([
    getFullStatistics(user.id),
    getMonthlyCashFlow(user.id, 6),
  ])
  return <StatisticsClient stats={stats} cashflow={cashflow} />
}

export default function StatisticsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Estatísticas" subtitle="Análise estatística detalhada das tuas finanças" />
      <Suspense fallback={<div className="space-y-6"><MetricGridSkeleton count={4} /><MetricGridSkeleton count={4} /></div>}>
        <StatsData />
      </Suspense>
    </div>
  )
}
