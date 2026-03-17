import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { incomes } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    await db.delete(incomes).where(and(eq(incomes.id, id), eq(incomes.userId, user.id)))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover renda' }, { status: 500 })
  }
}
