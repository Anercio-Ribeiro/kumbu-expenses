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

const loanSchema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  borrower: z.string().min(1, 'Nome do devedor obrigatório'),
  originalAmount: z.coerce.number().positive('Valor deve ser positivo'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})
type LoanForm = z.infer<typeof loanSchema>

async function api(url: string, method = 'GET', body?: object) {
  const res = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro')
  return data
}

export function LoansClient({ initialLoans, totalPending, monthlyIncome }: {
  initialLoans: any[]
  totalPending: number
  monthlyIncome: number
}) {
  const [loans, setLoans] = useState(initialLoans)
  const [openCreate, setOpenCreate] = useState(false)
  const [openRepay, setOpenRepay] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [repayAmount, setRepayAmount] = useState('')
  const [repayNotes, setRepayNotes] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoanForm>({
    resolver: zodResolver(loanSchema),
  })

  const pending = loans.filter(l => l.status !== 'repaid')
  const repaid = loans.filter(l => l.status === 'repaid')
  const totalLent = loans.reduce((s: number, l: any) => s + Number(l.originalAmount), 0)
  const totalRepaid = loans.reduce((s: number, l: any) => s + Number(l.repaidAmount), 0)
  const overdueCount = pending.filter((l: any) => l.dueDate && isPast(new Date(l.dueDate))).length

  async function onCreate(data: LoanForm) {
    setLoading(true)
    try {
      const { loan } = await api('/api/loans', 'POST', { ...data, dueDate: dueDate || undefined })
      setLoans(prev => [loan, ...prev])
      reset(); setDueDate(''); setOpenCreate(false)
      toast.success('Empréstimo registado! Despesa deduzida automaticamente do teu saldo.')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function onRepay() {
    if (!openRepay || !repayAmount) { toast.error('Introduz o valor devolvido'); return }
    setLoading(true)
    try {
      const result = await api(`/api/loans/${openRepay.id}/repay`, 'POST', {
        amount: parseFloat(repayAmount), notes: repayNotes,
      })
      setLoans(prev => prev.map(l => l.id === openRepay.id
        ? { ...l, status: result.repaid ? 'repaid' : 'partial', repaidAmount: Number(l.repaidAmount) + parseFloat(repayAmount) }
        : l
      ))
      setOpenRepay(null); setRepayAmount(''); setRepayNotes('')
      toast.success(result.repaid ? '✅ Empréstimo totalmente devolvido! Renda adicionada.' : 'Devolução parcial registada! Renda adicionada.')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('Remover este empréstimo?')) return
    try {
      await api(`/api/loans/${id}`, 'DELETE')
      setLoans(prev => prev.filter(l => l.id !== id))
      toast.success('Empréstimo removido')
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Emprestado" value={totalLent} variant="expense" icon="↗" />
        <MetricCard label="Por Receber" value={totalPending} variant="expense" icon="⏳" />
        <MetricCard label="Já Recebido" value={totalRepaid} variant="income" icon="✓" />
        <div className="kanza-metric">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Empréstimos Activos</p>
          <p className="text-2xl font-bold font-mono text-foreground">{pending.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{overdueCount > 0 ? `⚠️ ${overdueCount} em atraso` : '✅ Sem atrasos'}</p>
        </div>
      </div>

      {/* Alerts */}
      {overdueCount > 0 && (
        <div className="kanza-card border-expense/40 bg-expense/5 p-4 flex gap-3">
          <span className="text-xl">⏰</span>
          <div>
            <p className="font-semibold text-expense">{overdueCount} empréstimo{overdueCount > 1 ? 's' : ''} com devolução em atraso</p>
            <p className="text-sm text-muted-foreground mt-0.5">Considera contactar o devedor para acordar a devolução.</p>
          </div>
        </div>
      )}
      {totalPending > monthlyIncome * 0.5 && monthlyIncome > 0 && (
        <div className="kanza-card border-primary/30 bg-primary/5 p-4 flex gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="font-semibold">Impacto dos empréstimos na liquidez</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tens {formatKz(totalPending)} por receber — mais de 50% da tua renda mensal. Quando devolvidos, serão adicionados automaticamente como renda.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
          + Novo Empréstimo
        </button>
      </div>

      {/* Pending loans */}
      {pending.length === 0 ? (
        <div className="kanza-card p-16 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-lg font-semibold mb-2">Sem empréstimos activos</p>
          <p className="text-sm text-muted-foreground">Regista aqui valores que emprestaste para acompanhar o que ainda te devem.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Por Receber ({pending.length})</h2>
          {pending.map((loan: any) => {
            const isOverdue = loan.dueDate && isPast(new Date(loan.dueDate))
            const remaining = Number(loan.originalAmount) - Number(loan.repaidAmount)
            const progress = (Number(loan.repaidAmount) / Number(loan.originalAmount)) * 100
            return (
              <div key={loan.id} className={`kanza-card p-5 border-l-4 ${isOverdue ? 'border-l-expense' : 'border-l-blue-500/60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{loan.description}</span>
                      {loan.status === 'partial' && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Parcial</span>}
                      {isOverdue && <span className="text-xs bg-expense/10 text-expense px-2 py-0.5 rounded-full">Em atraso</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Devedor: <strong className="text-foreground">{loan.borrower}</strong></p>
                    {loan.dueDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Devolução prevista: {format(new Date(loan.dueDate), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                      </p>
                    )}
                    {Number(loan.repaidAmount) > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Já devolvido</span>
                          <span className="font-mono">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-income rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-bold text-blue-500 text-lg">{formatKz(remaining)}</p>
                    <p className="text-xs text-muted-foreground">por receber</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setOpenRepay(loan); setRepayAmount(remaining.toString()) }}
                    className="flex-1 bg-income/10 text-income py-2 rounded-xl text-xs font-semibold hover:bg-income/20 transition-all"
                  >
                    ↩ Registar Devolução
                  </button>
                  <button onClick={() => onDelete(loan.id)} className="px-4 py-2 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all border border-border">
                    Remover
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Repaid */}
      {repaid.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Devolvidos ({repaid.length})</h2>
          {repaid.map((loan: any) => (
            <div key={loan.id} className="kanza-card p-4 opacity-60 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{loan.description}</p>
                <p className="text-xs text-muted-foreground">{loan.borrower}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-muted-foreground">{formatKz(Number(loan.originalAmount))}</span>
                <span className="text-xs bg-income/10 text-income px-2 py-0.5 rounded-full font-semibold">✓ Devolvido</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <KanzaDialog open={openCreate} onOpenChange={setOpenCreate} title="Novo Empréstimo" description="Regista um valor que emprestaste — será deduzido automaticamente do teu saldo">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
            💡 Ao registar, é criada automaticamente uma <strong className="text-foreground">despesa</strong> com o valor emprestado. Quando receberes de volta, gera uma <strong className="text-foreground">renda</strong>.
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Descrição *</label>
            <input {...register('description')} placeholder="Ex: Empréstimo para compra de telemóvel" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Quem ficou com o dinheiro (Devedor) *</label>
            <input {...register('borrower')} placeholder="Ex: Maria Silva, Primo João…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errors.borrower && <p className="text-xs text-destructive mt-1">{errors.borrower.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor (Kz) *</label>
              <input {...register('originalAmount')} type="number" step="0.01" min="0" placeholder="0" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errors.originalAmount && <p className="text-xs text-destructive mt-1">{errors.originalAmount.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Devolução prevista</label>
              <DatePicker value={dueDate} onChange={setDueDate} locale="pt" placeholder="Opcional" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notas</label>
            <input {...register('notes')} placeholder="Motivo ou condições do empréstimo…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? 'A guardar…' : 'Registar Empréstimo'}
            </button>
          </div>
        </form>
      </KanzaDialog>

      {/* Repay Dialog */}
      {openRepay && (
        <KanzaDialog open={!!openRepay} onOpenChange={v => !v && setOpenRepay(null)} title="Registar Devolução" description={`${openRepay.borrower} — ${openRepay.description}`}>
          <div className="space-y-4">
            <div className="bg-income/5 border border-income/20 rounded-xl p-4 text-sm">
              <p className="font-semibold text-income mb-1">✅ O que acontece ao registar:</p>
              <p className="text-muted-foreground">O valor devolvido será adicionado automaticamente como <strong className="text-foreground">renda</strong> (categoria: Devolução de empréstimo). As tuas estatísticas serão actualizadas.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor devolvido (Kz) *</label>
              <input
                type="number" step="0.01" min="0"
                value={repayAmount}
                onChange={e => setRepayAmount(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">Em dívida: {formatKz(Number(openRepay.originalAmount) - Number(openRepay.repaidAmount))}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notas</label>
              <input
                value={repayNotes} onChange={e => setRepayNotes(e.target.value)}
                placeholder="Ex: Devolução parcial de Março…"
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setOpenRepay(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
              <button onClick={onRepay} disabled={loading || !repayAmount} className="flex-1 bg-income text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
                {loading ? 'A processar…' : `Registar ${repayAmount ? formatKz(parseFloat(repayAmount)) : ''}`}
              </button>
            </div>
          </div>
        </KanzaDialog>
      )}
    </div>
  )
}
