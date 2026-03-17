import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { expenses, credits } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { amortizeSchema } from '@/lib/validators/credit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body = await req.json()
    const parsed = amortizeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    // Verify this credit belongs to the user
    const credit = await db.query.credits.findFirst({
      where: and(eq(credits.id, id), eq(credits.userId, user.id)),
    })
    if (!credit) return NextResponse.json({ error: 'Crédito não encontrado' }, { status: 404 })

    const d = parsed.data
    const isAboveMonthly = d.amount > Number(credit.monthlyPayment)

    // Register as expense with category='credit', linked to this credit
    const [expense] = await db.insert(expenses).values({
      userId: user.id,
      creditId: id,
      description: isAboveMonthly
        ? `Amortização extra — ${credit.description}`
        : `Prestação mensal — ${credit.description}`,
      category: 'credit',
      amount: d.amount.toFixed(2),
      spentAt: new Date(d.date),
      notes: d.notes,
      isRecurring: !isAboveMonthly,
    }).returning()

    return NextResponse.json({ expense }, { status: 201 })
  } catch (e) {
    console.error('[amortize POST]', e)
    return NextResponse.json({ error: 'Erro ao registar amortização' }, { status: 500 })
  }
}
