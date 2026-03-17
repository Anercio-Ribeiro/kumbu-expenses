import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getGoals, getDashboardStats, getChildren } from '@/lib/db/queries'
import { PageHeader } from '@/components/ui/page-header'
import { GoalsClient } from './goals-client'

export const metadata: Metadata = { title: 'Objectivos' }

async function GoalsData() {
  const user = await getCurrentUser()
  const now = new Date()
  const [goals, stats, children] = await Promise.all([
    getGoals(user.id),
    getDashboardStats(user.id, now.getFullYear(), now.getMonth() + 1),
    getChildren(user.id),
  ])
  return (
    <GoalsClient
      initialGoals={goals as any[]}
      monthlySavings={Math.max(stats.balance, 0)}
      children={children}
    />
  )
}

export default function GoalsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Objectivos Financeiros"
        subtitle="Define, acompanha e alcança as tuas metas financeiras"
      />
      <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="kanza-card h-72 animate-pulse" />)}</div>}>
        <GoalsData />
      </Suspense>
    </div>
  )
}
