import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getMonthlyCashFlow } from '@/lib/db/queries'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const data = await getMonthlyCashFlow(user.id, 6)
    return NextResponse.json({ cashflow: data })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar fluxo de caixa' }, { status: 500 })
  }
}
