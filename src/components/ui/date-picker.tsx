'use client'

import { useState, useRef, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfWeek, endOfWeek } from 'date-fns'
import { pt, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string          // ISO date string YYYY-MM-DD
  onChange: (date: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  locale?: 'pt' | 'en'
  className?: string
  disabled?: boolean
}

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function DatePicker({
  value, onChange, placeholder, minDate, maxDate,
  locale = 'pt', className, disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + 'T00:00:00') : new Date())
  const ref = useRef<HTMLDivElement>(null)
  const dateFnsLocale = locale === 'pt' ? pt : enUS
  const weekdays = locale === 'pt' ? WEEKDAYS_PT : WEEKDAYS_EN

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selectedDate = value ? new Date(value + 'T00:00:00') : null

  const displayValue = selectedDate
    ? format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })
    : ''

  // Build calendar days grid
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  function selectDay(day: Date) {
    if (minDate && isBefore(day, minDate)) return
    if (maxDate && isBefore(maxDate, day)) return
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  function isDayDisabled(day: Date) {
    if (minDate && isBefore(day, minDate)) return true
    if (maxDate && isBefore(maxDate, day)) return true
    return false
  }

  const quickOptions = locale === 'pt'
    ? [
        { label: 'Hoje', value: format(new Date(), 'yyyy-MM-dd') },
        { label: 'Ontem', value: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') },
      ]
    : [
        { label: 'Today', value: format(new Date(), 'yyyy-MM-dd') },
        { label: 'Yesterday', value: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') },
      ]

  return (
    <div className={cn('relative', className)} ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={cn(
          'w-full flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-2.5 text-sm',
          'outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-left',
          'hover:border-primary/50 hover:bg-accent/20',
          disabled && 'opacity-50 cursor-not-allowed',
          open && 'ring-2 ring-primary/30 border-primary',
        )}
      >
        <span className="text-base leading-none">📅</span>
        <span className={cn('flex-1', !displayValue && 'text-muted-foreground')}>
          {displayValue || placeholder || (locale === 'pt' ? 'Seleccionar data' : 'Select date')}
        </span>
        <span className={cn('text-muted-foreground transition-transform text-xs', open && 'rotate-180')}>▾</span>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className={cn(
          'absolute z-50 mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden',
          'w-[320px]',
          // Position: try to open below, but flip up if near bottom of viewport
        )}>
          {/* Quick options */}
          <div className="flex gap-1 p-3 pb-0">
            {quickOptions.map(opt => (
              <button
                key={opt.label}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  value === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setViewDate(d => subMonths(d, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all text-sm"
            >
              ‹
            </button>
            <span className="text-sm font-semibold capitalize">
              {format(viewDate, 'MMMM yyyy', { locale: dateFnsLocale })}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(d => addMonths(d, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-all text-sm"
            >
              ›
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 px-3 pb-1">
            {weekdays.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {days.map(day => {
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isCurrent = isToday(day)
              const isOtherMonth = !isSameMonth(day, viewDate)
              const isDisabled = isDayDisabled(day)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'h-9 w-full rounded-lg text-sm font-medium transition-all',
                    isSelected && 'bg-primary text-primary-foreground font-bold',
                    !isSelected && isCurrent && 'text-primary font-bold border border-primary/40',
                    !isSelected && !isCurrent && !isOtherMonth && !isDisabled && 'hover:bg-accent text-foreground',
                    isOtherMonth && !isSelected && 'text-muted-foreground/40',
                    isDisabled && !isSelected && 'opacity-30 cursor-not-allowed',
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
