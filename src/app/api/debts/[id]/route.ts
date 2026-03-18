import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { deleteDebt } from '@/lib/db/debt-loan-queries'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    await deleteDebt(id, user.id)
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Erro ao remover dívida' }, { status: 500 }) }
}
