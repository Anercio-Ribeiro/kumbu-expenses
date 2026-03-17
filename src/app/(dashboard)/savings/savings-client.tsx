'use client'

import { useState } from 'react'
import { formatKz, simulateSavings, calc503020, calcSavingsRate } from '@/lib/utils/finance'
import { SavingsAreaChart } from '@/components/charts/savings-chart'
import { MetricCard } from '@/components/ui/metric-card'

interface Stats {
  totalIncome: number; totalExpenses: number; balance: number; savingsRate: number
  incomeChange: number; expensesChange: number
}

export function SavingsClient({ stats, cashflow }: { stats: Stats; cashflow: any[] }) {
  const [simPct, setSimPct] = useState(20)
  const sim = simulateSavings(stats.totalIncome, simPct)
  const rule = calc503020(stats.totalIncome)
  const actualSavingsRate = calcSavingsRate(stats.totalIncome, stats.totalExpenses)

  const rateColor = actualSavingsRate >= 20 ? 'text-income' : actualSavingsRate >= 10 ? 'text-primary' : 'text-expense'
  const rateStatus = actualSavingsRate >= 20 ? '✅ Excelente' : actualSavingsRate >= 10 ? '⚠️ A melhorar' : '❌ Crítico'

  return (
    <div className="space-y-6">
      {/* Current savings metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Taxa de Poupança" value={actualSavingsRate} format="percent" variant={actualSavingsRate >= 20 ? 'income' : actualSavingsRate >= 10 ? 'gold' : 'expense'} />
        <MetricCard label="Poupado este mês" value={Math.max(stats.balance, 0)} variant="income" />
        <MetricCard label="Meta 20%" value={stats.totalIncome * 0.2} variant="gold" />
        <MetricCard label="Diferença da meta" value={Math.abs(stats.balance - stats.totalIncome * 0.2)} variant={stats.balance >= stats.totalIncome * 0.2 ? 'income' : 'expense'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings rate gauge */}
        <div className="kanza-card p-6">
          <h2 className="font-semibold mb-1">Taxa de Poupança Actual</h2>
          <p className="text-xs text-muted-foreground mb-6">Calculada com base nas tuas rendas e despesas deste mês</p>

          {/* Visual gauge */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle cx="70" cy="70" r="56" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
                <circle
                  cx="70" cy="70" r="56"
                  fill="none"
                  stroke={actualSavingsRate >= 20 ? 'hsl(var(--income))' : actualSavingsRate >= 10 ? 'hsl(var(--primary))' : 'hsl(var(--expense))'}
                  strokeWidth="14"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - Math.min(actualSavingsRate, 100) / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold font-mono ${rateColor}`}>
                  {actualSavingsRate.toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground">poupança</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-5">
            <span className={`text-sm font-semibold ${rateColor}`}>{rateStatus}</span>
            {actualSavingsRate < 20 && (
              <p className="text-xs text-muted-foreground mt-1">
                Precisa poupar mais {formatKz(stats.totalIncome * 0.2 - stats.balance)} para atingir 20%
              </p>
            )}
          </div>

          {/* 50/30/20 breakdown */}
          <div className="space-y-3">
            {[
              { label: 'Necessidades (50%)', ideal: rule.needs, actual: stats.totalExpenses * 0.6, color: '#5b8ff9' },
              { label: 'Desejos (30%)', ideal: rule.wants, actual: stats.totalExpenses * 0.4, color: '#9c7aff' },
              { label: 'Poupança (20%)', ideal: rule.savings, actual: Math.max(stats.balance, 0), color: '#3ecf8e' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-mono font-semibold">{formatKz(row.ideal)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min((row.actual / row.ideal) * 100, 100)}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Savings simulator */}
        <div className="kanza-card p-6">
          <h2 className="font-semibold mb-1">Simulador de Poupança</h2>
          <p className="text-xs text-muted-foreground mb-6">Ajusta a taxa de poupança para ver projecções</p>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taxa de poupança</label>
              <span className="text-2xl font-bold font-mono text-primary">{simPct}%</span>
            </div>
            <input
              type="range" min={5} max={60} step={1} value={simPct}
              onChange={e => setSimPct(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: 'hsl(var(--primary))' }}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5% (Mínimo)</span>
              <span>20% (Recomendado)</span>
              <span>60%</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Valor mensal', value: formatKz(sim.monthlyAmount), color: 'text-primary' },
              { label: 'Valor anual', value: formatKz(sim.annualAmount), color: 'text-income' },
              { label: 'Em 3 anos', value: formatKz(sim.in3Years), color: 'text-foreground' },
              { label: 'Em 5 anos', value: formatKz(sim.in5Years), color: 'text-foreground' },
              { label: 'Em 10 anos', value: formatKz(sim.in10Years), color: 'text-foreground' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`font-mono font-bold text-sm ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-xs font-semibold text-primary mb-1">🚗 Para o carro de 18.000.000 Kz</p>
            <p className="text-sm font-bold">
              {sim.monthsForCar >= 9999 ? 'Aumenta a poupança' : `${sim.monthsForCar} meses (${sim.yearsForCar} anos)`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Poupando {formatKz(sim.monthlyAmount)} por mês
            </p>
          </div>
        </div>
      </div>

      {/* Historical savings trend */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-1">Evolução da Taxa de Poupança — 6 Meses</h2>
        <p className="text-xs text-muted-foreground mb-4">Passe o rato sobre a linha para ver detalhes de cada mês</p>
        <SavingsAreaChart data={cashflow} />
      </div>
    </div>
  )
}
