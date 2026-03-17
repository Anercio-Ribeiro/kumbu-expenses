import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getDashboardStats, getMonthlyCashFlow } from '@/lib/db/queries'
import { PageHeader } from '@/components/ui/page-header'
import { SavingsClient } from './savings-client'

export const metadata: Metadata = { title: 'Poupanças' }

async function SavingsData() {
  const user = await getCurrentUser()
  const now = new Date()
  const [stats, cashflow] = await Promise.all([
    getDashboardStats(user.id, now.getFullYear(), now.getMonth() + 1),
    getMonthlyCashFlow(user.id, 6),
  ])
  return <SavingsClient stats={stats} cashflow={cashflow} />
}

export default function SavingsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="Poupanças" subtitle="Acompanha a tua taxa de poupança e simula cenários futuros" />
      <Suspense fallback={<div className="h-64 kanza-card animate-pulse" />}>
        <SavingsData />
      </Suspense>
    </div>
  )
}
