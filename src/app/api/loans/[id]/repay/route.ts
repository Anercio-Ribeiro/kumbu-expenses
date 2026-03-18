import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { repayLoan } from '@/lib/db/debt-loan-queries'
import { z } from 'zod'

const schema = z.object({
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    const result = await repayLoan(id, user.id, parsed.data.amount, parsed.data.notes)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[loan repay]', e)
    return NextResponse.json({ error: e.message ?? 'Erro ao registar devolução' }, { status: 500 })
  }
}
