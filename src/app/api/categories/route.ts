import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getCategoriesWithSubs, createCategory, seedDefaultCategories } from '@/lib/db/category-queries'
import { db } from '@/lib/db'
import { customCategories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  icon: z.string().min(1, 'Ícone obrigatório'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
})

export async function GET() {
  try {
    const user = await getCurrentUser()

    // Auto-seed if user has no categories yet
    const existing = await db.select().from(customCategories).where(eq(customCategories.userId, user.id)).limit(1)
    if (existing.length === 0) {
      await seedDefaultCategories(user.id)
    }

    const data = await getCategoriesWithSubs(user.id)
    return NextResponse.json({ categories: data })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    const cat = await createCategory(user.id, parsed.data)
    return NextResponse.json({ category: cat }, { status: 201 })
  } catch (e) {
    console.error('[category POST]', e)
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 })
  }
}
