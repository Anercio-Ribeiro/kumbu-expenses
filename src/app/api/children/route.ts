import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { children } from '@/lib/db/schema'
import { getChildren } from '@/lib/db/queries'
import { childSchema } from '@/lib/validators'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const data = await getChildren(user.id)
    return NextResponse.json({ children: data })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()
    const parsed = childSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const [child] = await db.insert(children).values({
      userId: user.id,
      name: parsed.data.name,
      birthDate: new Date(parsed.data.birthDate),
      notes: parsed.data.notes,
    }).returning()
    return NextResponse.json({ child }, { status: 201 })
  } catch (e) {
    console.error('[child POST]', e)
    return NextResponse.json({ error: 'Erro ao criar filho' }, { status: 500 })
  }
}
