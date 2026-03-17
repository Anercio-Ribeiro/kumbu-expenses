import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getCategoriesWithTotals } from '@/lib/db/category-queries'
import { getMonthlyCashFlow } from '@/lib/db/queries'
import { PageHeader } from '@/components/ui/page-header'
import { CategoriesClient } from './categories-client'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Categorias' }

async function CatsData() {
  const user = await getCurrentUser()
  const now = new Date()
  const [catsWithTotals, cashflow] = await Promise.all([
    getCategoriesWithTotals(user.id, now.getFullYear(), now.getMonth() + 1),
    getMonthlyCashFlow(user.id, 6),
  ])
  return <CategoriesClient categories={catsWithTotals as any[]} cashflow={cashflow} />
}

export default function CategoriesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Categorias"
        subtitle="Análise detalhada dos gastos por categoria e sub-categoria"
        action={
          <Link
            href="/categories/manage"
            className="bg-card border border-border px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent transition-all"
          >
            ⊞ Gerir Categorias
          </Link>
        }
      />
      <Suspense fallback={<div className="h-64 kanza-card animate-pulse" />}>
        <CatsData />
      </Suspense>
    </div>
  )
}
