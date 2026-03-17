import { Metadata } from 'next'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth/session'
import { getChildren, getExpensesByCategory } from '@/lib/db/queries'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { eq, and, sum } from 'drizzle-orm'
import { PageHeader } from '@/components/ui/page-header'
import { ChildrenClient } from './children-client'

export const metadata: Metadata = { title: 'Filhos' }

async function ChildrenData() {
  const user = await getCurrentUser()
  const childrenList = await getChildren(user.id)

  // Fetch spending totals per child
  const childrenWithStats = await Promise.all(
    childrenList.map(async (child) => {
      const [spent] = await db
        .select({ total: sum(expenses.amount) })
        .from(expenses)
        .where(and(eq(expenses.childId, child.id), eq(expenses.userId, user.id)))
      return { ...child, totalSpent: Number(spent?.total ?? 0) }
    }),
  )

  return <ChildrenClient initialChildren={childrenWithStats} />
}

export default function ChildrenPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Filhos"
        subtitle="Gere gastos e planeamento financeiro para os teus filhos"
      />
      <Suspense fallback={<div className="h-48 kanza-card animate-pulse" />}>
        <ChildrenData />
      </Suspense>
    </div>
  )
}
