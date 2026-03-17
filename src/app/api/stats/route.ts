import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getFullStatistics } from '@/lib/db/queries'

export async function GET() {
  try {
    const user = await getCurrentUser()
    const data = await getFullStatistics(user.id)
    return NextResponse.json({ stats: data })
  } catch {
    return NextResponse.json({ error: 'Erro ao calcular estatísticas' }, { status: 500 })
  }
}
