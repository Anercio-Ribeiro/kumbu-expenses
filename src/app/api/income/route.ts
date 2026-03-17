import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { incomes } from '@/lib/db/schema'
import { getIncomes } from '@/lib/db/queries'
import { incomeSchema } from '@/lib/validators'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const data = await getIncomes(user.id)
    return NextResponse.json({ incomes: data })
  } catch (e) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()
    const parsed = incomeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { description, category, amount, period, receivedAt, notes, isRecurring } = parsed.data
    const [income] = await db.insert(incomes).values({
      userId: user.id,
      description,
      category,
      amount: amount.toFixed(2),
      period,
      receivedAt: new Date(receivedAt),
      notes,
      isRecurring,
    }).returning()
    return NextResponse.json({ income }, { status: 201 })
  } catch (e) {
    console.error('[income POST]', e)
    return NextResponse.json({ error: 'Erro ao criar renda' }, { status: 500 })
  }
}
