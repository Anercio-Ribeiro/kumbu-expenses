'use client'

import { formatKz, calcGoalProjection } from '@/lib/utils/finance'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

interface GoalRingProps {
  targetAmount: number
  currentAmount: number
  targetDate: Date
  currentMonthlySavings: number
  size?: number
  strokeWidth?: number
}

export function GoalRing({
  targetAmount, currentAmount, targetDate, currentMonthlySavings,
  size = 140, strokeWidth = 12,
}: GoalRingProps) {
  const proj = calcGoalProjection(targetAmount, currentAmount, targetDate, currentMonthlySavings)
  const r = (size - strokeWidth * 2) / 2
  const cx = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - proj.progressPct / 100)
  const color = proj.progressPct >= 80 ? '#3ecf8e' : proj.progressPct >= 40 ? '#e8b84b' : proj.isOnTrack ? '#5b8ff9' : '#f26060'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold font-mono text-foreground">{proj.progressPct.toFixed(0)}%</span>
          <span className="text-xs text-muted-foreground">alcançado</span>
        </div>
      </div>

      <div className="w-full space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Poupado</span>
          <span className="font-mono font-semibold text-income">+{formatKz(currentAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Restante</span>
          <span className="font-mono font-semibold">{formatKz(proj.remaining)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Necessário/mês</span>
          <span className={`font-mono font-semibold ${proj.isOnTrack ? 'text-income' : 'text-expense'}`}>
            {formatKz(proj.requiredMonthly)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Prazo previsto</span>
          <span className={`font-mono font-semibold text-xs ${proj.isOnTrack ? 'text-income' : 'text-expense'}`}>
            {format(proj.projectedDate, 'MMM yyyy', { locale: pt })}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
          <span className="text-muted-foreground">Estado</span>
          <span className={`font-semibold ${proj.isOnTrack ? 'text-income' : 'text-expense'}`}>
            {proj.isOnTrack ? '✅ No prazo' : '⚠️ Atrasado'}
          </span>
        </div>
      </div>
    </div>
  )
}
