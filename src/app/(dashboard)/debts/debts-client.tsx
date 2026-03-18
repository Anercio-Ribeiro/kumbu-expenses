'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format, isPast } from 'date-fns'
import { pt } from 'date-fns/locale'
import { formatKz } from '@/lib/utils/finance'
import { KanzaDialog } from '@/components/ui/dialog'
import { MetricCard } from '@/components/ui/metric-card'
import { DatePicker } from '@/components/ui/date-picker'

const debtSchema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  creditor: z.string().min(1, 'Credor obrigatório'),
  originalAmount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})
type DebtForm = z.infer<typeof debtSchema>

const settleSchema = z.object({
  partialAmount: z.coerce.number().positive().optional(),
})

async function api(url: string, method = 'GET', body?: object) {
  const res = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro')
  return data
}

export function DebtsClient({ initialDebts, totalPending, monthlyIncome }: {
  initialDebts: any[]
  totalPending: number
  monthlyIncome: number
}) {
  const [debts, setDebts] = useState(initialDebts)
  const [openCreate, setOpenCreate] = useState(false)
  const [openSettle, setOpenSettle] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [partialAmount, setPartialAmount] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DebtForm>({
    resolver: zodResolver(debtSchema),
  })

  const pending = debts.filter(d => d.status !== 'settled')
  const settled = debts.filter(d => d.status === 'settled')
  const totalDebt = pending.reduce((s: number, d: any) => s + Number(d.remainingAmount), 0)
  const debtRatio = monthlyIncome > 0 ? (totalDebt / monthlyIncome) * 100 : 0
  const overdueCount = pending.filter((d: any) => d.dueDate && isPast(new Date(d.dueDate)) && d.status !== 'settled').length

  async function onCreate(data: DebtForm) {
    setLoading(true)
    try {
      const { debt } = await api('/api/debts', 'POST', { ...data, dueDate: dueDate || undefined })
      setDebts(prev => [debt, ...prev])
      reset(); setDueDate(''); setOpenCreate(false)
      toast.success('Dívida registada com sucesso!')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function onSettle(full: boolean) {
    if (!openSettle) return
    setLoading(true)
    try {
      const body = full ? {} : { partialAmount: parseFloat(partialAmount) }
      const result = await api(`/api/debts/${openSettle.id}/settle`, 'POST', body)
      setDebts(prev => prev.map(d => d.id === openSettle.id
        ? { ...d, status: result.settled ? 'settled' : 'pending', remainingAmount: result.settled ? 0 : Number(d.remainingAmount) - parseFloat(partialAmount || '0'), settledAt: result.settled ? new Date() : null }
        : d
      ))
      setOpenSettle(null); setPartialAmount('')
      toast.success(result.settled
        ? '✅ Dívida quitada! Despesa gerada automaticamente.'
        : 'Pagamento parcial registado!')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('Remover esta dívida?')) return
    try {
      await api(`/api/debts/${id}`, 'DELETE')
      setDebts(prev => prev.filter(d => d.id !== id))
      toast.success('Dívida removida')
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total em Dívida" value={totalDebt} variant="expense" icon="⚠" />
        <MetricCard label="Dívidas Pendentes" value={pending.length} format="number" icon="#" />
        <MetricCard label="Quitadas" value={settled.length} format="number" variant="income" icon="✓" />
        <div className={`kanza-metric border-${debtRatio > 30 ? 'expense' : 'border'}/40`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">% da Renda</p>
          <p className={`text-2xl font-bold font-mono ${debtRatio > 30 ? 'text-expense' : debtRatio > 15 ? 'text-primary' : 'text-income'}`}>
            {monthlyIncome > 0 ? `${debtRatio.toFixed(1)}%` : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {debtRatio > 30 ? '❌ Nível crítico' : debtRatio > 15 ? '⚠️ Atenção' : '✅ Controlado'}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {overdueCount > 0 && (
        <div className="kanza-card border-expense/40 bg-expense/5 p-4 flex gap-3 items-start">
          <span className="text-xl">🚨</span>
          <div>
            <p className="font-semibold text-expense">
              {overdueCount} dívida{overdueCount > 1 ? 's' : ''} em atraso!
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Estas dívidas já ultrapassaram a data de vencimento. Quitá-las rapidamente evita encargos adicionais.
            </p>
          </div>
        </div>
      )}
      {debtRatio > 25 && monthlyIncome > 0 && (
        <div className="kanza-card border-primary/30 bg-primary/5 p-4 flex gap-3 items-start">
          <span className="text-xl">💡</span>
          <div>
            <p className="font-semibold">Impacto das dívidas no teu plano financeiro</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              As tuas dívidas ({formatKz(totalDebt)}) representam {debtRatio.toFixed(0)}% da tua renda mensal.
              Recomenda-se não exceder 25%. Para quitar tudo ao ritmo actual seria necessário {monthlyIncome > 0 ? Math.ceil(totalDebt / (monthlyIncome * 0.2)) : '—'} meses poupando 20% da renda.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
          + Nova Dívida
        </button>
      </div>

      {/* Pending debts */}
      {pending.length === 0 ? (
        <div className="kanza-card p-16 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-lg font-semibold mb-2">Sem dívidas pendentes!</p>
          <p className="text-sm text-muted-foreground">Regista aqui qualquer dívida para acompanhar o impacto nas tuas finanças.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pendentes ({pending.length})</h2>
          {pending.map((debt: any) => {
            const isOverdue = debt.dueDate && isPast(new Date(debt.dueDate))
            const progress = ((Number(debt.originalAmount) - Number(debt.remainingAmount)) / Number(debt.originalAmount)) * 100
            return (
              <div key={debt.id} className={`kanza-card p-5 border-l-4 ${isOverdue ? 'border-l-expense' : 'border-l-primary/40'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{debt.description}</span>
                      {isOverdue && <span className="text-xs bg-expense/10 text-expense px-2 py-0.5 rounded-full font-semibold">Em atraso</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Credor: <strong className="text-foreground">{debt.creditor}</strong></p>
                    {debt.dueDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Vencimento: {format(new Date(debt.dueDate), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                      </p>
                    )}
                    {Number(debt.originalAmount) !== Number(debt.remainingAmount) && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Já pago</span>
                          <span className="font-mono">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-income rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-bold text-expense text-lg">{formatKz(Number(debt.remainingAmount))}</p>
                    {Number(debt.originalAmount) !== Number(debt.remainingAmount) && (
                      <p className="text-xs text-muted-foreground">de {formatKz(Number(debt.originalAmount))}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setOpenSettle(debt); setPartialAmount('') }}
                    className="flex-1 bg-income/10 text-income py-2 rounded-xl text-xs font-semibold hover:bg-income/20 transition-all"
                  >
                    ✓ Quitar Dívida
                  </button>
                  <button
                    onClick={() => onDelete(debt.id)}
                    className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all border border-border"
                  >
                    Remover
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Settled */}
      {settled.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quitadas ({settled.length})</h2>
          {settled.map((debt: any) => (
            <div key={debt.id} className="kanza-card p-4 opacity-60 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{debt.description}</p>
                <p className="text-xs text-muted-foreground">{debt.creditor} · Quitada em {debt.settledAt ? format(new Date(debt.settledAt), 'd MMM yyyy', { locale: pt }) : '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-muted-foreground">{formatKz(Number(debt.originalAmount))}</span>
                <span className="text-xs bg-income/10 text-income px-2 py-0.5 rounded-full font-semibold">✓ Quitada</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <KanzaDialog open={openCreate} onOpenChange={setOpenCreate} title="Nova Dívida" description="Regista uma dívida para acompanhar o impacto nas tuas finanças">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Descrição *</label>
            <input {...register('description')} placeholder="Ex: Empréstimo banco, dívida fornecedor…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">A quem deves (Credor) *</label>
            <input {...register('creditor')} placeholder="Ex: Banco BFA, João Silva…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errors.creditor && <p className="text-xs text-destructive mt-1">{errors.creditor.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor (Kz) *</label>
              <input {...register('originalAmount')} type="number" step="0.01" min="0" placeholder="0" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errors.originalAmount && <p className="text-xs text-destructive mt-1">{errors.originalAmount.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Data de vencimento</label>
              <DatePicker value={dueDate} onChange={setDueDate} locale="pt" placeholder="Opcional" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notas</label>
            <input {...register('notes')} placeholder="Informação adicional…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </KanzaDialog>

      {/* Settle Dialog */}
      {openSettle && (
        <KanzaDialog open={!!openSettle} onOpenChange={v => !v && setOpenSettle(null)} title="Quitar Dívida" description={`${openSettle.description} — ${openSettle.creditor}`}>
          <div className="space-y-4">
            <div className="bg-income/5 border border-income/20 rounded-xl p-4 text-sm">
              <p className="font-semibold text-income mb-1">✅ O que acontece ao quitar:</p>
              <p className="text-muted-foreground">Será gerada automaticamente uma despesa de <strong className="text-foreground">{formatKz(Number(openSettle.remainingAmount))}</strong> com a nota "Quitação de dívida a {openSettle.creditor}". Esta despesa aparecerá nas tuas estatísticas.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Pagamento parcial (opcional)</label>
              <input
                type="number" step="0.01" min="0"
                value={partialAmount}
                onChange={e => setPartialAmount(e.target.value)}
                placeholder={`Deixa vazio para quitar tudo (${formatKz(Number(openSettle.remainingAmount))})`}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Se preencheres um valor parcial, a dívida ficará reduzida mas não quitada.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpenSettle(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
              <button
                onClick={() => onSettle(!partialAmount)}
                disabled={loading}
                className="flex-1 bg-income text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? 'A processar…' : partialAmount ? `Pagar ${formatKz(parseFloat(partialAmount))}` : `Quitar tudo — ${formatKz(Number(openSettle.remainingAmount))}`}
              </button>
            </div>
          </div>
        </KanzaDialog>
      )}
    </div>
  )
}
