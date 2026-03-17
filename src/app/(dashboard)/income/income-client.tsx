'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateIncome, useDeleteIncome } from '@/lib/hooks/use-api'
import { incomeSchema, type IncomeInput } from '@/lib/validators'
import { INCOME_CATEGORIES, formatKz } from '@/lib/utils/finance'
import { IncomeCategoryBadge } from '@/components/ui/category-badge'
import { KanzaDialog } from '@/components/ui/dialog'
import { MetricCard } from '@/components/ui/metric-card'

const today = new Date().toISOString().split('T')[0]
const CAT_OPTIONS = Object.entries(INCOME_CATEGORIES).map(([k, v]) => ({ value: k, label: v.label, icon: v.icon }))
const PERIOD_LABELS: Record<string, string> = { daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual', once: 'Pontual' }

export function IncomeClient({ initialIncomes }: { initialIncomes: any[] }) {
  const [incomes, setIncomes] = useState(initialIncomes)
  const [open, setOpen] = useState(false)

  const create = useCreateIncome()
  const del = useDeleteIncome()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IncomeInput>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { receivedAt: today, period: 'monthly', isRecurring: false },
  })

  const totals = useMemo(() => {
    const total = incomes.reduce((s, r) => s + Number(r.amount), 0)
    const monthly = incomes.filter(r => r.period === 'monthly').reduce((s, r) => s + Number(r.amount), 0)
    const max = incomes.length ? Math.max(...incomes.map(r => Number(r.amount))) : 0
    return { total, monthly, max }
  }, [incomes])

  async function onSubmit(data: IncomeInput) {
    const result = await create.mutateAsync(data) as any
    setIncomes(prev => [result.income, ...prev])
    reset({ receivedAt: today, period: 'monthly', isRecurring: false })
    setOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta renda?')) return
    await del.mutateAsync(id)
    setIncomes(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Total Rendas" value={totals.total} variant="income" icon="↑" />
        <MetricCard label="Renda Mensal Fixa" value={totals.monthly} variant="gold" />
        <MetricCard label="Maior Fonte" value={totals.max} />
      </div>

      <div className="flex justify-end">
        <button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
          + Nova Renda
        </button>
      </div>

      <div className="kanza-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {['Fonte', 'Categoria', 'Periodicidade', 'Data', 'Valor', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incomes.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">Sem rendas registadas</td></tr>
              ) : incomes.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()).map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-medium">{r.description}</p>
                      {r.notes && <p className="text-xs text-muted-foreground mt-0.5">{r.notes}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><IncomeCategoryBadge category={r.category} /></td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-muted-foreground bg-accent px-2.5 py-1 rounded-full">
                      {PERIOD_LABELS[r.period] ?? r.period}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {new Date(r.receivedAt).toLocaleDateString('pt-AO')}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-income">+{formatKz(Number(r.amount))}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleDelete(r.id)} className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10">
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <KanzaDialog open={open} onOpenChange={setOpen} title="Nova Renda" description="Regista uma fonte de rendimento">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Descrição *</label>
            <input {...register('description')} placeholder="Ex: Salário, Freelance…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Categoria *</label>
              <select {...register('category')} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                {CAT_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Periodicidade</label>
              <select {...register('period')} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                {Object.entries(PERIOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor (Kz) *</label>
              <input {...register('amount')} type="number" step="0.01" min="0" placeholder="0" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Data *</label>
              <input {...register('receivedAt')} type="date" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errors.receivedAt && <p className="text-xs text-destructive mt-1">{errors.receivedAt.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notas</label>
            <input {...register('notes')} placeholder="Nota adicional…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button type="submit" disabled={create.isPending} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {create.isPending ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </KanzaDialog>
    </div>
  )
}
