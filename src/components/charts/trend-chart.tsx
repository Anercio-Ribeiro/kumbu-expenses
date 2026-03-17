'use client'

import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatKz } from '@/lib/utils/finance'

interface TrendData {
  month: string
  monthFull: string
  income: number
  expense: number
  balance: number
  savingsRate: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as TrendData
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xl text-sm min-w-[220px]">
      <p className="font-semibold mb-3">{d.monthFull}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-6 mb-1">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            {p.dataKey === 'savingsRate' ? `${p.value}%` : formatKz(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="amount"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false} tickLine={false}
          tickFormatter={v => formatKz(v, { compact: true })}
          width={85}
        />
        <YAxis
          yAxisId="pct"
          orientation="right"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `${v}%`}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => ({ income: 'Renda', expense: 'Despesas', savingsRate: 'Taxa Poupança' }[value] ?? value)}
          iconSize={8} wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
        />
        <Bar yAxisId="amount" dataKey="income" name="income" fill="hsl(var(--income))" opacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={36} />
        <Bar yAxisId="amount" dataKey="expense" name="expense" fill="hsl(var(--expense))" opacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={36} />
        <Line
          yAxisId="pct"
          type="monotone"
          dataKey="savingsRate"
          name="savingsRate"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
