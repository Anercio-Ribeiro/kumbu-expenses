'use client'

import { formatKz, calcSavingsRate, EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/utils/finance'
import { MetricCard } from '@/components/ui/metric-card'
import { CashFlowChart } from '@/components/charts/cashflow-chart'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import Link from 'next/link'

interface TopCat {
  categoryId: string; name: string; icon: string; color: string; total: number; txCount: number
}
interface Props {
  userName: string
  stats: {
    totalIncome: number; totalExpenses: number; balance: number
    savingsRate: number; incomeChange: number; expensesChange: number
  }
  cashflow: Array<{ month: string; monthFull: string; income: number; expense: number; balance: number; savingsRate: number }>
  topCategories: TopCat[]
  goals: any[]
}


function CustomCategoryDonut({ data }: { data: Array<{ categoryId: string; name: string; icon: string; color: string; total: number }> }) {
  const total = data.reduce((s, d) => s + d.total, 0)
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    const pct = total > 0 ? ((d.total / total) * 100).toFixed(1) : '0'
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
        <p className="font-semibold mb-1">{d.icon} {d.name}</p>
        <p style={{ color: d.color }} className="font-mono font-bold">{formatKz(d.total)}</p>
        <p className="text-muted-foreground">{pct}% do total</p>
        <p className="text-muted-foreground">{d.txCount} transacções</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
            paddingAngle={2} dataKey="total">
            {data.map(d => <Cell key={d.categoryId} fill={d.color} opacity={0.88} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-1.5">
        {data.slice(0, 6).map(d => (
          <div key={d.categoryId} className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-muted-foreground truncate">{d.icon} {d.name}</span>
            <span className="font-mono ml-auto flex-shrink-0">
              {total > 0 ? ((d.total / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardClient({ stats, cashflow, topCategories, goals, userName }: Props) {
  const primaryGoal = goals.find(g => g.status === 'active') ?? goals[0]
  const goalPct = primaryGoal
    ? Math.min((Number(primaryGoal.currentAmount) / Number(primaryGoal.targetAmount)) * 100, 100)
    : 0

  // Règle 50/30/20 analysis
  const rule503020 = {
    needs: stats.totalIncome * 0.5,
    wants: stats.totalIncome * 0.3,
    savings: stats.totalIncome * 0.2,
  }

  return (
    <div className="space-y-6">
      {/* Metric row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Renda Total"
          value={stats.totalIncome}
          change={stats.incomeChange}
          variant="income"
          icon="↑"
        />
        <MetricCard
          label="Despesas Totais"
          value={stats.totalExpenses}
          change={stats.expensesChange}
          variant="expense"
          icon="↓"
        />
        <MetricCard
          label="Saldo Disponível"
          value={stats.balance}
          variant={stats.balance >= 0 ? 'income' : 'expense'}
          icon="="
        />
        <MetricCard
          label="Taxa de Poupança"
          value={stats.savingsRate}
          format="percent"
          variant={stats.savingsRate >= 20 ? 'income' : stats.savingsRate >= 10 ? 'gold' : 'expense'}
          icon="◆"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="kanza-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="kanza-section-title">Fluxo de Caixa — 6 Meses</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Passe o rato sobre as barras para detalhes</p>
            </div>
          </div>
          <CashFlowChart data={cashflow} />
        </div>

        <div className="kanza-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="kanza-section-title">Despesas por Categoria</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Mês actual — passe o rato para detalhes</p>
            </div>
            <Link href="/categories" className="text-xs text-primary hover:underline">Ver tudo →</Link>
          </div>
          {topCategories.length > 0 ? (
            <CustomCategoryDonut data={topCategories} />
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Sem despesas este mês
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 50/30/20 Rule */}
        <div className="kanza-card p-6">
          <h2 className="kanza-section-title mb-1">Regra 50/30/20</h2>
          <p className="text-xs text-muted-foreground mb-4">Distribuição ideal do teu rendimento</p>
          {[
            { label: 'Necessidades (50%)', target: rule503020.needs, color: '#5b8ff9', desc: 'Casa, comida, saúde' },
            { label: 'Desejos (30%)', target: rule503020.wants, color: '#9c7aff', desc: 'Lazer, compras extras' },
            { label: 'Poupança (20%)', target: rule503020.savings, color: '#3ecf8e', desc: 'Investimentos, objectivos' },
          ].map(r => (
            <div key={r.label} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono font-semibold">{formatKz(r.target, { compact: true })}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '100%', background: r.color, opacity: 0.7 }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Primary goal */}
        {primaryGoal && (
          <div className="kanza-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="kanza-section-title">Objectivo Principal</h2>
              <Link href="/goals" className="text-xs text-primary hover:underline">Ver todos →</Link>
            </div>
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">{primaryGoal.icon}</div>
              <p className="font-semibold text-sm">{primaryGoal.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Meta: {formatKz(Number(primaryGoal.targetAmount))}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-mono font-bold text-primary">{goalPct.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${goalPct}%`,
                    background: goalPct >= 80 ? '#3ecf8e' : goalPct >= 40 ? '#e8b84b' : '#5b8ff9',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatKz(Number(primaryGoal.currentAmount))} poupado</span>
                <span>Prazo: {format(new Date(primaryGoal.targetDate), 'MMM yyyy', { locale: pt })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="kanza-card p-6">
          <h2 className="kanza-section-title mb-4">Resumo Rápido</h2>
          <div className="space-y-3">
            {[
              {
                label: 'Poupança este mês',
                value: formatKz(Math.max(stats.balance, 0)),
                color: stats.balance >= 0 ? 'text-income' : 'text-expense',
              },
              {
                label: 'Despesa média/dia',
                value: formatKz(stats.totalExpenses / 30),
                color: 'text-foreground',
              },
              {
                label: 'Relação D/R',
                value: stats.totalIncome > 0 ? `${((stats.totalExpenses / stats.totalIncome) * 100).toFixed(0)}%` : '—',
                color: stats.totalExpenses / stats.totalIncome > 0.8 ? 'text-expense' : 'text-income',
              },
              {
                label: 'Meta 20% poupança',
                value: formatKz(stats.totalIncome * 0.2),
                color: 'text-primary',
              },
              {
                label: 'Diferença da meta',
                value: formatKz(Math.abs(stats.balance - stats.totalIncome * 0.2)),
                color: stats.balance >= stats.totalIncome * 0.2 ? 'text-income' : 'text-expense',
              },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className={`text-xs font-mono font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
