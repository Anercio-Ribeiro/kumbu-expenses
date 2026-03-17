'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { EXPENSE_CATEGORIES, formatKz, type ExpenseCategory } from '@/lib/utils/finance'

interface CategoryData {
  category: string
  total: string | number
  count: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const meta = EXPENSE_CATEGORIES[d.payload.category as ExpenseCategory] ?? EXPENSE_CATEGORIES.other
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xl text-sm">
      <p className="flex items-center gap-2 font-semibold mb-2">
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
      </p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-bold" style={{ color: meta.color }}>{formatKz(Number(d.value))}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Quota</span>
          <span className="font-mono">{d.payload.percentage}%</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Transacções</span>
          <span className="font-mono">{d.payload.count}</span>
        </div>
      </div>
    </div>
  )
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  if (percentage < 5) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {percentage}%
    </text>
  )
}

export function CategoryDonutChart({ data }: { data: CategoryData[] }) {
  const total = data.reduce((s, d) => s + Number(d.total), 0)
  const chartData = data.map(d => ({
    ...d,
    total: Number(d.total),
    percentage: total > 0 ? Math.round((Number(d.total) / total) * 100) : 0,
    label: EXPENSE_CATEGORIES[d.category as ExpenseCategory]?.label ?? d.category,
    color: EXPENSE_CATEGORIES[d.category as ExpenseCategory]?.color ?? '#8b91a8',
  }))

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="total"
            labelLine={false}
            label={CustomLabel}
          >
            {chartData.map((entry) => (
              <Cell key={entry.category} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {chartData.map(d => (
          <div key={d.category} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            <span className="text-muted-foreground truncate">{d.label}</span>
            <span className="font-mono ml-auto">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
