import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getLoans, createLoan } from '@/lib/db/debt-loan-queries'
import { z } from 'zod'

const schema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  borrower: z.string().min(1, 'Nome do devedor obrigatório'),
  originalAmount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    const data = await getLoans(user.id)
    return NextResponse.json({ loans: data })
  } catch { return NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    const d = parsed.data
    const result = await createLoan(user.id, {
      ...d,
      dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    console.error('[loan POST]', e)
    return NextResponse.json({ error: 'Erro ao criar empréstimo' }, { status: 500 })
  }
}
