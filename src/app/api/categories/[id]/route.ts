import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { updateCategory, archiveCategory, createSubcategory } from '@/lib/db/category-queries'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

const subSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  icon: z.string().min(1, 'Ícone obrigatório'),
  color: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    const updated = await updateCategory(user.id, id, parsed.data)
    return NextResponse.json({ category: updated })
  } catch {
    return NextResponse.json({ error: 'Erro ao actualizar categoria' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    await archiveCategory(user.id, id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao arquivar categoria' }, { status: 500 })
  }
}

// POST /api/categories/[id]/subcategory → create subcategory
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body = await req.json()
    const parsed = subSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    const sub = await createSubcategory(user.id, id, parsed.data)
    return NextResponse.json({ subcategory: sub }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erro ao criar subcategoria' }, { status: 500 })
  }
}
