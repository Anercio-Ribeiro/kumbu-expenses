import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getUserByEmail } from '@/lib/db/queries'
import { seedDefaultCategories } from '@/lib/db/category-queries'
import { registerSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { name, email, password } = parsed.data
    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Este email já está registado' }, { status: 409 })
    }
    const passwordHash = await hash(password, 12)
    const [user] = await db.insert(users).values({ name, email, passwordHash }).returning({ id: users.id, name: users.name, email: users.email })
    // Seed default categories for new user (async, non-blocking for UX)
    seedDefaultCategories(user.id).catch(e => console.error('[seed categories]', e))
    return NextResponse.json({ user }, { status: 201 })
  } catch (e) {
    console.error('[register]', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
