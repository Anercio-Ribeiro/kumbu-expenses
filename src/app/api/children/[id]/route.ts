import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getChildWithStats } from '@/lib/db/queries'
import { db } from '@/lib/db'
import { children } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const data = await getChildWithStats(id, user.id)
    if (!data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json({ child: data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar filho' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    await db.delete(children).where(and(eq(children.id, id), eq(children.userId, user.id)))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 })
  }
}
