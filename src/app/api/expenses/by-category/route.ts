import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getExpensesByCategory } from '@/lib/db/queries'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = req.nextUrl
    const year = Number(searchParams.get('year') ?? new Date().getFullYear())
    const month = Number(searchParams.get('month') ?? new Date().getMonth() + 1)
    const data = await getExpensesByCategory(user.id, year, month)
    return NextResponse.json({ categories: data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
  }
}
