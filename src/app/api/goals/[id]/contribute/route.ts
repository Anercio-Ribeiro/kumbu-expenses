import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { addGoalContribution } from '@/lib/db/queries'
import { contributionSchema } from '@/lib/validators'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body = await req.json()
    const parsed = contributionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    await addGoalContribution(id, user.id, parsed.data.amount, parsed.data.notes)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[contribution POST]', e)
    return NextResponse.json({ error: 'Erro ao registar contribuição' }, { status: 500 })
  }
}
