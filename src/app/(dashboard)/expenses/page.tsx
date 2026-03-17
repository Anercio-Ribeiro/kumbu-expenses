import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getExpenses, getChildren } from '@/lib/db/queries'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton, MetricGridSkeleton } from '@/components/ui/skeletons'
import { ExpensesClient } from './expenses-client'

export const metadata: Metadata = { title: 'Despesas' }

async function ExpensesData() {
  const user = await getCurrentUser()
  const now = new Date()
  const [expenses, children] = await Promise.all([
    getExpenses(user.id, { year: now.getFullYear(), month: now.getMonth() + 1 }),
    getChildren(user.id),
  ])
  return <ExpensesClient initialExpenses={expenses as any[]} children={children} />
}

export default function ExpensesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Despesas" subtitle="Regista e categoriza todos os teus gastos" />
      <Suspense fallback={<div className="space-y-4"><MetricGridSkeleton count={4} /><TableSkeleton rows={8} cols={5} /></div>}>
        <ExpensesData />
      </Suspense>
    </div>
  )
}
