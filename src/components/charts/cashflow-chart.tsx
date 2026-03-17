'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { formatKz } from '@/lib/utils/finance'

interface CashFlowData {
  month: string
  monthFull: string
  income: number
  expense: number
  balance: number
  savingsRate: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as CashFlowData
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xl text-sm min-w-[200px]">
      <p className="font-semibold text-foreground mb-3">{d.monthFull}</p>
      <div className="space-y-2">
        <div className="flex justify-between items-center gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-income inline-block" />
            Renda
          </span>
          <span className="font-mono font-semibold text-income">+{formatKz(d.income)}</span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-expense inline-block" />
            Despesas
          </span>
          <span className="font-mono font-semibold text-expense">-{formatKz(d.expense)}</span>
        </div>
        <div className="border-t border-border pt-2 flex justify-between items-center gap-4">
          <span className="text-muted-foreground">Saldo</span>
          <span className={`font-mono font-bold ${d.balance >= 0 ? 'text-income' : 'text-expense'}`}>
            {d.balance >= 0 ? '+' : ''}{formatKz(d.balance)}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-muted-foreground">Taxa Poupança</span>
          <span className={`font-mono font-bold ${d.savingsRate >= 20 ? 'text-income' : d.savingsRate >= 10 ? 'text-primary' : 'text-expense'}`}>
            {d.savingsRate}%
          </span>
        </div>
      </div>
    </div>
  )
}

export function CashFlowChart({ data }: { data: CashFlowData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => formatKz(v, { compact: true })}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))', radius: 6 }} />
        <Legend
          formatter={(value) => value === 'income' ? 'Renda' : 'Despesas'}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
        />
        <Bar dataKey="income" name="income" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.85} />
        <Bar dataKey="expense" name="expense" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} maxBarSize={40} opacity={0.75} />
      </BarChart>
    </ResponsiveContainer>
  )
}
