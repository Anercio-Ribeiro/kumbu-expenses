import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getCredits, getMonthlySalary } from '@/lib/db/credit-queries'
import { PageHeader } from '@/components/ui/page-header'
import { CreditsClient } from './credits-client'

export const metadata: Metadata = { title: 'Créditos' }

async function CreditsData() {
  const user = await getCurrentUser()
  const [creditsList, salary] = await Promise.all([
    getCredits(user.id),
    getMonthlySalary(user.id),
  ])
  return <CreditsClient initialCredits={creditsList as any[]} monthlySalary={salary} />
}

export default function CreditsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Créditos & Dívidas"
        subtitle="Acompanha os teus créditos bancários, prestações e amortizações"
      />
      <Suspense fallback={
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="kanza-card h-64 animate-pulse" />)}
        </div>
      }>
        <CreditsData />
      </Suspense>
    </div>
  )
}
