import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { getExpenses } from '@/lib/db/queries'
import { z } from 'zod'

// API-level schema — category is optional when customCategoryId is provided
const createExpenseSchema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  category: z.enum([
    'food', 'transport', 'health', 'leisure', 'education',
    'housing', 'clothing', 'technology', 'children', 'savings', 'credit', 'other',
  ]).default('other'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  spentAt: z.string().min(1, 'Data obrigatória'),
  notes: z.string().optional().nullable(),
  childId: z.string().uuid().optional().nullable(),
  customCategoryId: z.string().uuid().optional().nullable(),
  subcategoryId: z.string().uuid().optional().nullable(),
  isRecurring: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = req.nextUrl
    const filters = {
      category: searchParams.get('category') ?? undefined,
      childId: searchParams.get('childId') ?? undefined,
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      month: searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
    }
    const data = await getExpenses(user.id, filters)
    return NextResponse.json({ expenses: data })
  } catch {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()

    const parsed = createExpenseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      )
    }

    const {
      description, category, amount, spentAt, notes,
      childId, customCategoryId, subcategoryId, isRecurring, tags,
    } = parsed.data

    const [expense] = await db.insert(expenses).values({
      userId: user.id,
      description,
      category,
      amount: amount.toFixed(2),
      spentAt: new Date(spentAt),
      notes: notes ?? null,
      childId: childId ?? null,
      customCategoryId: customCategoryId ?? null,
      subcategoryId: subcategoryId ?? null,
      isRecurring,
      tags,
    }).returning()

    return NextResponse.json({ expense }, { status: 201 })
  } catch (e) {
    console.error('[expense POST]', e)
    return NextResponse.json({ error: 'Erro ao criar despesa' }, { status: 500 })
  }
}
