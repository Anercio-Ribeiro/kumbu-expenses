import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getDashboardStats, getMonthlyCashFlow, getFullStatistics } from '@/lib/db/queries'

// GET /api/stats/dashboard?year=2026&month=3
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = req.nextUrl
    const year = Number(searchParams.get('year') ?? new Date().getFullYear())
    const month = Number(searchParams.get('month') ?? new Date().getMonth() + 1)
    const stats = await getDashboardStats(user.id, year, month)
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
