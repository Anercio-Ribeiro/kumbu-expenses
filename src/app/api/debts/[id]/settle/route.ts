import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { settleDebt } from '@/lib/db/debt-loan-queries'
import { z } from 'zod'

const schema = z.object({
  partialAmount: z.coerce.number().positive().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    const partialAmount = parsed.success ? parsed.data.partialAmount : undefined
    const result = await settleDebt(id, user.id, partialAmount)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[debt settle]', e)
    return NextResponse.json({ error: e.message ?? 'Erro ao quitar dívida' }, { status: 500 })
  }
}
