'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatKz } from '@/lib/utils/finance'

interface SavingsData {
  month: string
  monthFull: string
  savingsRate: number
  balance: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as SavingsData
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xl text-sm">
      <p className="font-semibold mb-2">{d.monthFull}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Taxa de Poupança</span>
          <span className={`font-mono font-bold ${d.savingsRate >= 20 ? 'text-income' : d.savingsRate >= 10 ? 'text-primary' : 'text-expense'}`}>
            {d.savingsRate}%
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Valor Poupado</span>
          <span className="font-mono font-semibold text-income">+{formatKz(d.balance)}</span>
        </div>
        <div className="border-t border-border pt-1 mt-1 text-xs text-muted-foreground">
          {d.savingsRate >= 20 ? '✅ Meta de 20% atingida!' : d.savingsRate >= 10 ? '⚠️ Abaixo da meta de 20%' : '❌ Taxa crítica — revê os gastos'}
        </div>
      </div>
    </div>
  )
}

export function SavingsAreaChart({ data }: { data: SavingsData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `${v}%`}
          domain={[0, 'auto']}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="savingsRate"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#savingsGrad)"
          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
