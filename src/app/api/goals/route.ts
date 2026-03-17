import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { goals } from '@/lib/db/schema'
import { getGoals } from '@/lib/db/queries'
import { goalSchema } from '@/lib/validators'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const data = await getGoals(user.id)
    return NextResponse.json({ goals: data })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()
    const parsed = goalSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const d = parsed.data
    const [goal] = await db.insert(goals).values({
      userId: user.id,
      name: d.name,
      description: d.description,
      targetAmount: d.targetAmount.toFixed(2),
      currentAmount: (d.currentAmount ?? 0).toFixed(2),
      targetDate: new Date(d.targetDate),
      icon: d.icon,
      childId: d.childId ?? null,
      monthlySavingsTarget: d.monthlySavingsTarget ? d.monthlySavingsTarget.toFixed(2) : null,
    }).returning()
    return NextResponse.json({ goal }, { status: 201 })
  } catch (e) {
    console.error('[goal POST]', e)
    return NextResponse.json({ error: 'Erro ao criar objectivo' }, { status: 500 })
  }
}
