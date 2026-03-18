'use client'

import { formatKz, calcSavingsRate } from '@/lib/utils/finance'
import { getBudgetSuggestion } from '@/lib/utils/financial-health'
import { MetricCard } from '@/components/ui/metric-card'
import { CashFlowChart } from '@/components/charts/cashflow-chart'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import Link from 'next/link'
import type { FinancialHealth } from '@/lib/utils/financial-health'
import { useI18n } from '@/lib/i18n/context'

interface TopCat {
  categoryId: string; name: string; icon: string; color: string; total: number; txCount: number
}

interface Props {
  userName: string
  stats: { totalIncome: number; totalExpenses: number; balance: number; savingsRate: number; incomeChange: number; expensesChange: number }
  cashflow: Array<{ month: string; monthFull: string; income: number; expense: number; balance: number; savingsRate: number }>
  topCategories: TopCat[]
  goals: any[]
  debtSummary: { totalPending: number; overdueCount: number }
  loanSummary: { totalPending: number }
  health: FinancialHealth
}

// ─── Custom Donut Chart ────────────────────────────────────────────────────────
function CategoryDonut({ data }: { data: TopCat[] }) {
  const total = data.reduce((s, d) => s + d.total, 0)
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload as TopCat & { total: number }
    const pct = total > 0 ? ((d.total / total) * 100).toFixed(1) : '0'
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs min-w-[160px]">
        <p className="font-semibold mb-1">{d.icon} {d.name}</p>
        <p className="font-mono font-bold" style={{ color: d.color }}>{formatKz(d.total)}</p>
        <p className="text-muted-foreground">{pct}% do total</p>
        <p className="text-muted-foreground">{d.txCount} transacções</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="total">
            {data.map(d => <Cell key={d.categoryId} fill={d.color} opacity={0.9} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-1.5">
        {data.slice(0, 6).map(d => (
          <div key={d.categoryId} className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-muted-foreground truncate">{d.icon} {d.name}</span>
            <span className="font-mono ml-auto flex-shrink-0">{total > 0 ? ((d.total / total) * 100).toFixed(0) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Financial Health Widget ───────────────────────────────────────────────────
function HealthWidget({ health, monthlyIncome }: { health: FinancialHealth; monthlyIncome: number }) {
  const r = (health.score / 100) * 283 // circumference of r=45 circle
  const suggestion = getBudgetSuggestion(monthlyIncome)
  return (
    <div className="kanza-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-sm">Saúde Financeira</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Score baseado nos teus dados actuais</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: health.color + '20', color: health.color }}>
          {health.label}
        </span>
      </div>

      <div className="flex items-center gap-6 mb-5">
        {/* Score ring */}
        <div className="relative flex-shrink-0">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={health.color} strokeWidth="10"
              strokeDasharray={`${(health.score / 100) * 264} 264`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
            <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill={health.color}>{health.score}</text>
            <text x="50" y="60" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">/ 100</text>
          </svg>
        </div>

        {/* Budget suggestions */}
        <div className="flex-1 space-y-2 text-xs">
          {[
            { label: 'Necessidades', pct: suggestion.needs, color: '#5b8ff9' },
            { label: 'Lazer / Desejos', pct: suggestion.wants, color: '#9c7aff' },
            { label: 'Poupança mínima', pct: suggestion.savings, color: '#3ecf8e' },
          ].map(r => (
            <div key={r.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono font-semibold">{r.pct}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {health.alerts.length > 0 && (
        <div className="space-y-1.5">
          {health.alerts.slice(0, 2).map((alert, i) => (
            <div key={i} className="flex gap-2 p-2.5 bg-expense/5 border border-expense/20 rounded-lg">
              <span className="text-xs">⚠️</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{alert}</p>
            </div>
          ))}
        </div>
      )}
      {health.alerts.length === 0 && (
        <div className="flex gap-2 p-2.5 bg-income/5 border border-income/20 rounded-lg">
          <span className="text-xs">✅</span>
          <p className="text-xs text-muted-foreground">Finanças em ordem! Continua assim.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardClient({ stats, cashflow, topCategories, goals, debtSummary, loanSummary, health }: Props) {
  const primaryGoal = goals.find(g => g.status === 'active') ?? goals[0]
  const goalPct = primaryGoal ? Math.min((Number(primaryGoal.currentAmount) / Number(primaryGoal.targetAmount)) * 100, 100) : 0
  const suggestion = getBudgetSuggestion(stats.totalIncome)

  return (
    <div className="space-y-6">

      {/* Debt/Loan alert banners */}
      {(debtSummary.overdueCount > 0 || debtSummary.totalPending > stats.totalIncome * 0.5) && (
        <div className="kanza-card border-expense/40 bg-expense/5 p-4 flex items-center justify-between gap-4">
          <div className="flex gap-3 items-center">
            <span className="text-xl">🚨</span>
            <div>
              <p className="font-semibold text-sm text-expense">
                {debtSummary.overdueCount > 0
                  ? `${debtSummary.overdueCount} dívida${debtSummary.overdueCount > 1 ? 's' : ''} em atraso!`
                  : 'Dívidas elevadas'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total em dívida: {formatKz(debtSummary.totalPending)}
                {stats.totalIncome > 0 && ` (${((debtSummary.totalPending / stats.totalIncome) * 100).toFixed(0)}% da renda)`}
              </p>
            </div>
          </div>
          <Link href="/debts" className="text-xs text-expense font-semibold hover:underline flex-shrink-0">Ver dívidas →</Link>
        </div>
      )}

      {loanSummary.totalPending > 0 && (
        <div className="kanza-card border-blue-500/30 bg-blue-500/5 p-4 flex items-center justify-between gap-4">
          <div className="flex gap-3 items-center">
            <span className="text-xl">🤝</span>
            <div>
              <p className="font-semibold text-sm">Tens {formatKz(loanSummary.totalPending)} por receber</p>
              <p className="text-xs text-muted-foreground mt-0.5">Empréstimos concedidos ainda por devolver</p>
            </div>
          </div>
          <Link href="/loans" className="text-xs text-primary font-semibold hover:underline flex-shrink-0">Ver empréstimos →</Link>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Renda Total" value={stats.totalIncome} change={stats.incomeChange} variant="income" icon="↑" />
        <MetricCard label="Despesas Totais" value={stats.totalExpenses} change={stats.expensesChange} variant="expense" icon="↓" />
        <MetricCard label="Saldo Disponível" value={stats.balance} variant={stats.balance >= 0 ? 'income' : 'expense'} icon="=" />
        <MetricCard label="Taxa de Poupança" value={stats.savingsRate} format="percent" variant={stats.savingsRate >= suggestion.savings ? 'income' : stats.savingsRate >= suggestion.savings / 2 ? 'gold' : 'expense'} icon="◆" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="kanza-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm">Fluxo de Caixa — 6 Meses</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Passe o rato sobre as barras para detalhes</p>
            </div>
          </div>
          <CashFlowChart data={cashflow} />
        </div>
        <div className="kanza-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm">Despesas por Categoria</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Mês actual</p>
            </div>
            <Link href="/categories" className="text-xs text-primary hover:underline">Ver tudo →</Link>
          </div>
          {topCategories.length > 0 ? (
            <CategoryDonut data={topCategories} />
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Sem despesas este mês
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Financial Health */}
        <HealthWidget health={health} monthlyIncome={stats.totalIncome} />

        {/* Budget suggestion 50/30/20 adapted */}
        <div className="kanza-card p-6">
          <h2 className="font-semibold text-sm mb-1">Distribuição Sugerida</h2>
          <p className="text-xs text-muted-foreground mb-4">Baseada na tua renda actual</p>
          {[
            { label: 'Necessidades', target: suggestion.needs, amount: Math.round(stats.totalIncome * suggestion.needs / 100), color: '#5b8ff9', icon: '🏠' },
            { label: 'Lazer / Desejos', target: suggestion.wants, amount: suggestion.leisureBudget, color: '#9c7aff', icon: '🎬' },
            { label: 'Poupança mínima', target: suggestion.savings, amount: suggestion.savingsBudget, color: '#3ecf8e', icon: '💰' },
          ].map(r => (
            <div key={r.label} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{r.icon} {r.label} ({r.target}%)</span>
                <span className="font-mono font-semibold">{formatKz(r.amount)}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.target}%`, background: r.color, opacity: 0.8 }} />
              </div>
            </div>
          ))}
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground">Orçamento máximo lazer: <strong className="text-foreground">{formatKz(suggestion.leisureBudget)}</strong></p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Fundo emergência recomendado: <strong className="text-foreground">{suggestion.emergency} meses de despesas</strong></p>
          </div>
        </div>

        {/* Primary goal + quick summary */}
        <div className="space-y-4">
          {primaryGoal && (
            <div className="kanza-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm">Objectivo Principal</h2>
                <Link href="/goals" className="text-xs text-primary hover:underline">Ver →</Link>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{primaryGoal.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{primaryGoal.name}</p>
                  <p className="text-xs text-muted-foreground">{formatKz(Number(primaryGoal.currentAmount))} / {formatKz(Number(primaryGoal.targetAmount))}</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${goalPct}%`, background: goalPct >= 75 ? '#3ecf8e' : goalPct >= 40 ? '#e8b84b' : '#5b8ff9' }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">{goalPct.toFixed(1)}% alcançado</p>
            </div>
          )}

          {/* Quick stats */}
          <div className="kanza-card p-5">
            <h2 className="font-semibold text-sm mb-3">Resumo Rápido</h2>
            <div className="space-y-2">
              {[
                { label: 'Despesa/dia (média)', value: formatKz(stats.totalExpenses / 30), color: 'text-foreground' },
                { label: 'Meta poupança', value: formatKz(suggestion.savingsBudget), color: 'text-income' },
                { label: 'Dívidas activas', value: formatKz(debtSummary.totalPending), color: debtSummary.totalPending > 0 ? 'text-expense' : 'text-income' },
                { label: 'A receber', value: formatKz(loanSummary.totalPending), color: loanSummary.totalPending > 0 ? 'text-primary' : 'text-muted-foreground' },
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
    </div>
  )
}
