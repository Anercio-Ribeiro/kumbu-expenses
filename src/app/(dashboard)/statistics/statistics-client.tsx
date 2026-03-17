'use client'

import { formatKz, EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/utils/finance'
import { MetricCard } from '@/components/ui/metric-card'
import { TrendChart } from '@/components/charts/trend-chart'

interface StatsData {
  mean: number; median: number; stdDev: number; min: number; max: number
  totalIncome: number; totalExpenses: number; balance: number; savingsRate: number
  coefficientOfVariation: number; count: number
  topExpenses: Array<{ description: string; amount: string; spentAt: Date; category: string }>
}

export function StatisticsClient({
  stats,
  cashflow,
}: {
  stats: StatsData | null
  cashflow: any[]
}) {
  if (!stats) {
    return (
      <div className="kanza-card p-16 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-lg font-semibold mb-2">Sem dados suficientes</h3>
        <p className="text-sm text-muted-foreground">Regista pelo menos algumas despesas para ver estatísticas detalhadas.</p>
      </div>
    )
  }

  const cvLabel = stats.coefficientOfVariation < 30 ? '— Baixa variabilidade' : stats.coefficientOfVariation < 60 ? '— Variabilidade moderada' : '— Alta variabilidade'

  return (
    <div className="space-y-6">
      {/* Descriptive stats */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Estatísticas Descritivas — Despesas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Média" value={stats.mean} icon="x̄" />
          <MetricCard label="Mediana" value={stats.median} icon="M" />
          <MetricCard label="Desvio Padrão" value={stats.stdDev} icon="σ" />
          <MetricCard label="Nº Transacções" value={stats.count} format="number" icon="#" />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Resumo Financeiro — 6 Meses</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Rendas" value={stats.totalIncome} variant="income" />
          <MetricCard label="Total Despesas" value={stats.totalExpenses} variant="expense" />
          <MetricCard label="Saldo Acumulado" value={stats.balance} variant={stats.balance >= 0 ? 'income' : 'expense'} />
          <MetricCard label="Taxa de Poupança" value={stats.savingsRate} format="percent" variant={stats.savingsRate >= 20 ? 'income' : stats.savingsRate >= 10 ? 'gold' : 'expense'} />
        </div>
      </section>

      {/* Trend + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="kanza-card p-6 lg:col-span-2">
          <h2 className="font-semibold mb-1">Tendência — 6 Meses</h2>
          <p className="text-xs text-muted-foreground mb-4">Passe o rato sobre os pontos e barras para detalhes</p>
          <TrendChart data={cashflow} />
        </div>

        <div className="kanza-card p-6 space-y-1">
          <h2 className="font-semibold mb-1">Análise Avançada</h2>
          <p className="text-xs text-muted-foreground mb-4">Métricas explicadas em linguagem simples</p>
          {[
            {
              label: 'Despesa mais baixa',
              sub: 'O valor mais pequeno que gastaste numa única transacção',
              value: formatKz(stats.min),
              color: 'text-income',
            },
            {
              label: 'Despesa mais alta',
              sub: 'O valor mais alto que gastaste numa única transacção',
              value: formatKz(stats.max),
              color: 'text-expense',
            },
            {
              label: 'Diferença entre extremos',
              sub: `Distância entre a tua despesa mais baixa e mais alta — quanto maior, mais irregular é o padrão de gastos`,
              value: formatKz(stats.max - stats.min),
              color: 'text-foreground',
            },
            {
              label: 'Regularidade dos teus gastos',
              sub: stats.coefficientOfVariation < 30
                ? 'Os teus gastos são consistentes — gastas valores parecidos de transacção para transacção'
                : stats.coefficientOfVariation < 60
                ? 'Os teus gastos variam moderadamente — há alguma inconsistência no valor das despesas'
                : 'Os teus gastos variam muito — algumas despesas são muito maiores do que outras',
              value: stats.coefficientOfVariation < 30 ? '✅ Consistente' : stats.coefficientOfVariation < 60 ? '⚠️ Moderado' : '❌ Muito variável',
              color: stats.coefficientOfVariation < 30 ? 'text-income' : stats.coefficientOfVariation < 60 ? 'text-primary' : 'text-expense',
            },
            {
              label: 'Quanto gastas por dia (média)',
              sub: 'Valor médio diário de despesas nos últimos 6 meses',
              value: formatKz(stats.totalExpenses / 180),
              color: 'text-foreground',
            },
            {
              label: 'Quanto recebes por dia (média)',
              sub: 'Valor médio diário de rendimentos nos últimos 6 meses',
              value: formatKz(stats.totalIncome / 180),
              color: 'text-income',
            },
          ].map(row => (
            <div key={row.label} className="py-3 border-b border-border last:border-0">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{row.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{row.sub}</p>
                </div>
                <span className={`text-sm font-mono font-bold flex-shrink-0 ${row.color}`}>{row.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top expenses */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-4">Top 5 Maiores Despesas</h2>
        <div className="space-y-2">
          {stats.topExpenses.map((e, i) => {
            // Support both custom and built-in categories
            const builtinMeta = EXPENSE_CATEGORIES[e.category as ExpenseCategory] ?? EXPENSE_CATEGORIES.other
            const icon = builtinMeta.icon
            const color = builtinMeta.color
            const pct = stats.totalExpenses > 0 ? (Number(e.amount) / stats.totalExpenses) * 100 : 0
            return (
              <div key={i} className="flex items-center gap-4">
                <span className="text-lg w-8 text-center flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium truncate">{e.description}</p>
                    <span className="font-mono font-bold text-expense text-sm ml-3 flex-shrink-0">
                      {formatKz(Number(e.amount))}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {pct.toFixed(1)}% do total · {new Date(e.spentAt).toLocaleDateString('pt-AO')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interpretation guide */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-4">📖 Como interpretar estes números</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p><span className="font-semibold text-foreground">Média (x̄)</span> — O valor típico de uma despesa. Se muito diferente da mediana, há valores extremos.</p>
            <p><span className="font-semibold text-foreground">Mediana (M)</span> — 50% das despesas estão abaixo deste valor. Mais robusta que a média.</p>
            <p><span className="font-semibold text-foreground">Desvio Padrão (σ)</span> — Quanto variam os teus gastos. Valores altos indicam inconsistência.</p>
          </div>
          <div className="space-y-2">
            <p><span className="font-semibold text-foreground">Coef. Variação</span> — &lt;30%: gastos consistentes. 30–60%: variação moderada. &gt;60%: gastos imprevisíveis.</p>
            <p><span className="font-semibold text-foreground">Taxa de Poupança</span> — Meta recomendada: ≥20%. Abaixo de 10% é zona de risco financeiro.</p>
            <p><span className="font-semibold text-foreground">Relação D/R</span> — Percentagem de renda consumida por despesas. Idealmente abaixo de 80%.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
