import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { credits } from '@/lib/db/schema'
import { getCreditWithPayments } from '@/lib/db/credit-queries'
import { and, eq } from 'drizzle-orm'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const data = await getCreditWithPayments(id, user.id)
    if (!data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json({ credit: data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar crédito' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    await db.delete(credits).where(and(eq(credits.id, id), eq(credits.userId, user.id)))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover crédito' }, { status: 500 })
  }
}
