import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getIncomes } from '@/lib/db/queries'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton, MetricGridSkeleton } from '@/components/ui/skeletons'
import { IncomeClient } from './income-client'

export const metadata: Metadata = { title: 'Rendas' }

async function IncomeData() {
  const user = await getCurrentUser()
  const incomes = await getIncomes(user.id)
  return <IncomeClient initialIncomes={incomes as any[]} />
}

export default function IncomePage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Rendas" subtitle="Gere todas as tuas fontes de rendimento" />
      <Suspense fallback={<div className="space-y-4"><MetricGridSkeleton count={3} /><TableSkeleton rows={6} cols={5} /></div>}>
        <IncomeData />
      </Suspense>
    </div>
  )
}
