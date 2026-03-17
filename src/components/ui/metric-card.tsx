import { cn } from '@/lib/utils'
import { formatKz } from '@/lib/utils/finance'

interface MetricCardProps {
  label: string
  value: number | string
  change?: number
  changeLabel?: string
  prefix?: string
  format?: 'currency' | 'percent' | 'number' | 'raw'
  variant?: 'default' | 'income' | 'expense' | 'gold' | 'info'
  icon?: string
  className?: string
}

const variantStyles = {
  default: 'border-border',
  income: 'border-income/30 dark:border-income/20',
  expense: 'border-expense/30 dark:border-expense/20',
  gold: 'border-primary/40 dark:border-primary/25',
  info: 'border-blue-500/30',
}

const valueColors = {
  default: 'text-foreground',
  income: 'text-income',
  expense: 'text-expense',
  gold: 'text-primary',
  info: 'text-blue-500',
}

export function MetricCard({
  label, value, change, changeLabel, format = 'currency',
  variant = 'default', icon, className,
}: MetricCardProps) {
  const displayValue = (() => {
    const n = typeof value === 'string' ? parseFloat(value) : value
    if (format === 'currency') return formatKz(n)
    if (format === 'percent') return `${n.toFixed(1)}%`
    if (format === 'number') return n.toLocaleString('pt-AO')
    return String(value)
  })()

  const isPositiveChange = (change ?? 0) >= 0

  return (
    <div className={cn('kanza-metric animate-fade-in', variantStyles[variant], className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon && <span className="text-lg opacity-70">{icon}</span>}
      </div>
      <p className={cn('text-2xl font-bold font-mono tracking-tight', valueColors[variant])}>
        {displayValue}
      </p>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', isPositiveChange ? 'text-income' : 'text-expense')}>
          <span>{isPositiveChange ? '↑' : '↓'}</span>
          <span>{Math.abs(change).toFixed(1)}% {changeLabel ?? 'vs mês anterior'}</span>
        </div>
      )}
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="kanza-metric">
      <div className="skeleton h-3 w-24 mb-3" />
      <div className="skeleton h-7 w-36 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  )
}
