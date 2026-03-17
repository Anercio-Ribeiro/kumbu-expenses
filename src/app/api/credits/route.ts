import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { credits } from '@/lib/db/schema'
import { getCredits } from '@/lib/db/credit-queries'
import { creditSchema } from '@/lib/validators/credit'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const data = await getCredits(user.id)
    return NextResponse.json({ credits: data })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()
    const parsed = creditSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const d = parsed.data
    const [credit] = await db.insert(credits).values({
      userId: user.id,
      description: d.description,
      entity: d.entity,
      totalAmount: d.totalAmount.toFixed(2),
      monthlyPayment: d.monthlyPayment.toFixed(2),
      totalMonths: d.totalMonths,
      startDate: new Date(d.startDate),
      notes: d.notes,
    }).returning()
    return NextResponse.json({ credit }, { status: 201 })
  } catch (e) {
    console.error('[credit POST]', e)
    return NextResponse.json({ error: 'Erro ao criar crédito' }, { status: 500 })
  }
}
