import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, user.id)))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover despesa' }, { status: 500 })
  }
}
