import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { updateSubcategory, archiveSubcategory } from '@/lib/db/category-queries'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
  color: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    const updated = await updateSubcategory(user.id, id, parsed.data)
    return NextResponse.json({ subcategory: updated })
  } catch {
    return NextResponse.json({ error: 'Erro ao actualizar subcategoria' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    await archiveSubcategory(user.id, id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao arquivar subcategoria' }, { status: 500 })
  }
}
