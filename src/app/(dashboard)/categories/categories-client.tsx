'use client'

import { useState } from 'react'
import { formatKz } from '@/lib/utils/finance'
import Link from 'next/link'

interface SubWithTotal {
  id: string; name: string; icon: string; color?: string | null
  total: number; txCount: number
}
interface CatWithTotal {
  id: string; name: string; icon: string; color: string
  total: number; txCount: number; subcategories: SubWithTotal[]
}

export function CategoriesClient({ categories }: { categories: CatWithTotal[]; cashflow: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const withSpend = categories.filter(c => c.total > 0).sort((a, b) => b.total - a.total)
  const totalSpend = withSpend.reduce((s, c) => s + c.total, 0)

  if (withSpend.length === 0) {
    return (
      <div className="kanza-card p-16 text-center">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-lg font-semibold mb-2">Sem despesas este mês</p>
        <p className="text-sm text-muted-foreground mb-4">
          Regista algumas despesas para ver a distribuição por categorias e sub-categorias.
        </p>
        <Link href="/categories/manage" className="text-primary text-sm hover:underline">
          Gerir categorias →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="kanza-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Total gasto este mês</h2>
          <span className="font-mono font-bold text-expense text-lg">{formatKz(totalSpend)}</span>
        </div>
        {/* Stacked percentage bar */}
        <div className="h-4 rounded-full overflow-hidden flex gap-0.5">
          {withSpend.map(c => (
            <div
              key={c.id}
              className="h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(c.total / totalSpend) * 100}%`,
                background: c.color,
                minWidth: c.total / totalSpend > 0.02 ? undefined : '2px',
              }}
              title={`${c.name}: ${formatKz(c.total)}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {withSpend.slice(0, 6).map(c => (
            <div key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              <span>{c.icon} {c.name}</span>
              <span className="font-mono">{((c.total / totalSpend) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category accordion list */}
      <div className="space-y-3">
        {withSpend.map((cat, idx) => {
          const pct = totalSpend > 0 ? (cat.total / totalSpend) * 100 : 0
          const isOpen = expanded === cat.id
          const activeSubs = cat.subcategories.filter(s => s.total > 0).sort((a, b) => b.total - a.total)

          return (
            <div
              key={cat.id}
              className="kanza-card overflow-hidden transition-all"
              style={{ borderLeftColor: cat.color, borderLeftWidth: 4 }}
            >
              {/* Header row */}
              <button
                onClick={() => setExpanded(isOpen ? null : cat.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-accent/20 transition-all text-left"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: cat.color + '20' }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{cat.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                      <span className="font-mono font-bold" style={{ color: cat.color }}>
                        {formatKz(cat.total)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: cat.color, transitionDelay: `${idx * 40}ms` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {cat.txCount} transacç{cat.txCount === 1 ? 'ão' : 'ões'}
                      {activeSubs.length > 0 && ` · ${activeSubs.length} sub-cat`}
                    </span>
                    <span className="text-muted-foreground text-xs flex-shrink-0">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
              </button>

              {/* Subcategory expansion */}
              {isOpen && activeSubs.length > 0 && (
                <div className="border-t border-border px-4 py-3 space-y-2 bg-accent/10">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Sub-categorias
                  </p>
                  {activeSubs.map(sub => {
                    const subPct = cat.total > 0 ? (sub.total / cat.total) * 100 : 0
                    const subColor = sub.color ?? cat.color
                    return (
                      <div key={sub.id} className="flex items-center gap-3">
                        <span className="text-base w-6 text-center flex-shrink-0">{sub.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{sub.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{subPct.toFixed(0)}%</span>
                              <span className="font-mono font-semibold">{formatKz(sub.total)}</span>
                            </div>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${subPct}%`, background: subColor }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground w-16 text-right flex-shrink-0">
                          {sub.txCount} tx
                        </span>
                      </div>
                    )
                  })}

                  {/* Sub-categories with zero spend */}
                  {cat.subcategories.filter(s => s.total === 0).length > 0 && (
                    <p className="text-[11px] text-muted-foreground/50 pt-1">
                      + {cat.subcategories.filter(s => s.total === 0).length} sub-categorias sem gastos este mês
                    </p>
                  )}
                </div>
              )}

              {isOpen && activeSubs.length === 0 && (
                <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground bg-accent/10">
                  Sem gastos por sub-categoria este mês.
                  <Link href="/categories/manage" className="text-primary ml-1 hover:underline">
                    Adicionar sub-categorias →
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Categories without spend */}
      {categories.filter(c => c.total === 0).length > 0 && (
        <div className="kanza-card p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Categorias sem gastos este mês
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.filter(c => c.total === 0).map(c => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{ background: c.color + '15', color: c.color }}
              >
                {c.icon} {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
