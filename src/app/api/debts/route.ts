import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getDebts, createDebt } from '@/lib/db/debt-loan-queries'
import { z } from 'zod'

const schema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  creditor: z.string().min(1, 'Credor obrigatório'),
  originalAmount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    const data = await getDebts(user.id)
    return NextResponse.json({ debts: data })
  } catch { return NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    const d = parsed.data
    const debt = await createDebt(user.id, {
      ...d,
      dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
    })
    return NextResponse.json({ debt }, { status: 201 })
  } catch (e) {
    console.error('[debt POST]', e)
    return NextResponse.json({ error: 'Erro ao criar dívida' }, { status: 500 })
  }
}
