import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getCategoriesWithSubs, seedDefaultCategories } from '@/lib/db/category-queries'
import { db } from '@/lib/db'
import { customCategories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PageHeader } from '@/components/ui/page-header'
import { ManageCategoriesClient } from './manage-categories-client'

export const metadata: Metadata = { title: 'Gerir Categorias' }

async function CategoriesData() {
  const user = await getCurrentUser()

  // Auto-seed default categories on first visit
  const existing = await db.select().from(customCategories)
    .where(eq(customCategories.userId, user.id)).limit(1)
  if (existing.length === 0) {
    await seedDefaultCategories(user.id)
  }

  const categories = await getCategoriesWithSubs(user.id)
  return <ManageCategoriesClient initialCategories={categories as any[]} />
}

export default function ManageCategoriesPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Gerir Categorias"
        subtitle="Cria, edita e organiza as tuas categorias e sub-categorias de despesas"
      />
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="kanza-card h-48 animate-pulse" />
          ))}
        </div>
      }>
        <CategoriesData />
      </Suspense>
    </div>
  )
}
