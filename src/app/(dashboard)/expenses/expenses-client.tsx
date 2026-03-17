'use client'

import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateExpense, useDeleteExpense } from '@/lib/hooks/use-api'
import { formatKz, calcDescriptiveStats } from '@/lib/utils/finance'
import { ExpenseCategoryBadge } from '@/components/ui/category-badge'
import { KanzaDialog } from '@/components/ui/dialog'
import { MetricCard } from '@/components/ui/metric-card'

// ─── Validation ───────────────────────────────────────────────────────────────
// Use a looser schema here — category comes from custom cats, not the enum
const formSchema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  spentAt: z.string().min(1, 'Data obrigatória'),
  notes: z.string().optional(),
  childId: z.string().optional(),
  isRecurring: z.boolean().default(false),
})
type FormValues = z.infer<typeof formSchema>

const today = new Date().toISOString().split('T')[0]

// ─── Helpers ──────────────────────────────────────────────────────────────────
// builtinKey that maps to the "Filhos" category
const CHILDREN_BUILTIN_KEY = 'children'

export function ExpensesClient({
  initialExpenses,
  children,
}: {
  initialExpenses: any[]
  children: any[]
}) {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [open, setOpen] = useState(false)
  const [filterCat, setFilterCat] = useState('')
  const [filterChild, setFilterChild] = useState('')
  const [search, setSearch] = useState('')

  // Custom categories loaded from API
  const [customCats, setCustomCats] = useState<any[]>([])
  const [catsLoading, setCatsLoading] = useState(true)

  // Form-level category/subcategory (outside react-hook-form because they drive conditional UI)
  const [selectedCatId, setSelectedCatId] = useState('')
  const [selectedSubId, setSelectedSubId] = useState('')

  const create = useCreateExpense()
  const del = useDeleteExpense()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { spentAt: today, isRecurring: false },
  })

  // Load custom categories once
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => { if (d.categories) setCustomCats(d.categories) })
      .catch(() => {/* silently ignore */})
      .finally(() => setCatsLoading(false))
  }, [])

  // Subcategories for the currently selected category
  const activeSubs = useMemo(
    () => customCats.find((c: any) => c.id === selectedCatId)?.subcategories ?? [],
    [customCats, selectedCatId],
  )

  // Is the selected category the "Filhos" built-in?
  const isChildrenCategory = useMemo(() => {
    const cat = customCats.find((c: any) => c.id === selectedCatId)
    return cat?.builtinKey === CHILDREN_BUILTIN_KEY
  }, [customCats, selectedCatId])

  // ─── Submit handler ─────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues) {
    if (!selectedCatId) {
      // Show a manual error — category is required but outside react-hook-form
      alert('Por favor selecciona uma categoria.')
      return
    }

    const payload = {
      // Pass 'other' as the enum category fallback (API accepts it)
      category: 'other' as const,
      description: data.description,
      amount: data.amount,
      spentAt: data.spentAt,
      notes: data.notes,
      isRecurring: data.isRecurring,
      // Only pass childId if the Filhos category is selected
      childId: isChildrenCategory ? (data.childId || null) : null,
      customCategoryId: selectedCatId,
      subcategoryId: selectedSubId || null,
    }

    const result = await create.mutateAsync(payload as any) as any
    const cat = customCats.find((c: any) => c.id === selectedCatId)
    const sub = cat?.subcategories?.find((s: any) => s.id === selectedSubId)

    setExpenses(prev => [{
      ...result.expense,
      child: children.find(c => c.id === data.childId),
      customCategory: cat,
      subcategory: sub,
    }, ...prev])

    // Reset all form state
    reset({ spentAt: today, isRecurring: false })
    setSelectedCatId('')
    setSelectedSubId('')
    setOpen(false)
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Remover esta despesa?')) return
    await del.mutateAsync(id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  // ─── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      expenses
        .filter(e => {
          if (filterCat && e.customCategoryId !== filterCat) return false
          if (filterChild && e.childId !== filterChild) return false
          if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false
          return true
        })
        .sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime()),
    [expenses, filterCat, filterChild, search],
  )

  const stats = useMemo(() => calcDescriptiveStats(filtered.map(e => Number(e.amount))), [filtered])
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0)

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Filtrado" value={total} variant="expense" />
        <MetricCard label="Nº Transacções" value={filtered.length} format="number" icon="#" />
        <MetricCard label="Média por Despesa" value={stats?.mean ?? 0} />
        <MetricCard label="Maior Despesa" value={stats?.max ?? 0} variant="expense" />
      </div>

      {/* Filters + add button */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar despesa…"
          className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-52"
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="">Todas as categorias</option>
          {customCats.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>
        {children.length > 0 && (
          <select
            value={filterChild}
            onChange={e => setFilterChild(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Todos os filhos</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button
          onClick={() => setOpen(true)}
          className="ml-auto bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
        >
          + Nova Despesa
        </button>
      </div>

      {/* Table */}
      <div className="kanza-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {['Descrição', 'Categoria', 'Filho/a', 'Data', 'Valor', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    Nenhuma despesa encontrada
                  </td>
                </tr>
              ) : filtered.map(e => (
                <tr
                  key={e.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">{e.description}</p>
                    {e.notes && <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    {e.customCategory ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: e.customCategory.color + '20', color: e.customCategory.color }}
                      >
                        {e.customCategory.icon} {e.customCategory.name}
                        {e.subcategory && (
                          <span className="opacity-70">
                            {' '}/ {e.subcategory.icon} {e.subcategory.name}
                          </span>
                        )}
                      </span>
                    ) : (
                      <ExpenseCategoryBadge category={e.category} />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {e.child?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {new Date(e.spentAt).toLocaleDateString('pt-AO')}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-expense">
                    -{formatKz(Number(e.amount))}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Expense Dialog ── */}
      <KanzaDialog open={open} onOpenChange={setOpen} title="Nova Despesa" description="Regista um gasto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Descrição *
            </label>
            <input
              {...register('description')}
              placeholder="Ex: Supermercado Jumbo"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Category + Subcategory row */}
          <div className="grid grid-cols-2 gap-3">
            <div className={activeSubs.length > 0 ? '' : 'col-span-2'}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Categoria *
              </label>
              <select
                value={selectedCatId}
                onChange={e => {
                  setSelectedCatId(e.target.value)
                  setSelectedSubId('')
                }}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                disabled={catsLoading}
              >
                <option value="">{catsLoading ? 'A carregar…' : 'Selecciona categoria…'}</option>
                {customCats.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              {!selectedCatId && !catsLoading && (
                <p className="text-xs text-muted-foreground mt-1">Selecciona uma categoria para continuar</p>
              )}
            </div>

            {/* Subcategory — only shown when the selected category has subs */}
            {activeSubs.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Sub-categoria
                </label>
                <select
                  value={selectedSubId}
                  onChange={e => setSelectedSubId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="">Geral</option>
                  {activeSubs.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Amount + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Valor (Kz) *
              </label>
              <input
                {...register('amount')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {errors.amount && (
                <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Data *
              </label>
              <input
                {...register('spentAt')}
                type="date"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/*
            Child selector — only visible when the selected category is "Filhos"
            AND the user has children registered
          */}
          {isChildrenCategory && children.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Para qual filho/a?
              </label>
              <select
                {...register('childId')}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">Seleccionar…</option>
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Notas
            </label>
            <input
              {...register('notes')}
              placeholder="Nota opcional…"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                reset({ spentAt: today, isRecurring: false })
                setSelectedCatId('')
                setSelectedSubId('')
              }}
              className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending || !selectedCatId}
              className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {create.isPending ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </KanzaDialog>
    </div>
  )
}
