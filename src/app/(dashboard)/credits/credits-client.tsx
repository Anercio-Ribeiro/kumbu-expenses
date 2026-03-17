'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { formatKz } from '@/lib/utils/finance'
import { calcCreditSummary, buildAmortizationSchedule, creditSalaryImpactLabel } from '@/lib/utils/credit'
import { creditSchema, amortizeSchema, type CreditInput, type AmortizeInput } from '@/lib/validators/credit'
import { KanzaDialog } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const today = new Date().toISOString().split('T')[0]

async function fetchApi(url: string, options?: RequestInit) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro')
  return data
}

export function CreditsClient({ initialCredits, monthlySalary }: { initialCredits: any[]; monthlySalary: number }) {
  const [credits, setCredits] = useState(initialCredits)
  const [openCreate, setOpenCreate] = useState(false)
  const [openAmortize, setOpenAmortize] = useState<string | null>(null)
  const [openSchedule, setOpenSchedule] = useState<string | null>(null)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [loadingAmortize, setLoadingAmortize] = useState(false)

  const { register: regC, handleSubmit: hsC, reset: resetC, formState: { errors: errC } } = useForm<CreditInput>({
    resolver: zodResolver(creditSchema),
    defaultValues: { startDate: today },
  })
  const { register: regA, handleSubmit: hsA, reset: resetA, formState: { errors: errA } } = useForm<AmortizeInput>({
    resolver: zodResolver(amortizeSchema),
    defaultValues: { date: today },
  })

  async function onCreateCredit(data: CreditInput) {
    setLoadingCreate(true)
    try {
      const result = await fetchApi('/api/credits', { method: 'POST', body: JSON.stringify(data) })
      setCredits(prev => [result.credit, ...prev])
      resetC()
      setOpenCreate(false)
      toast.success('Crédito registado com sucesso!')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoadingCreate(false) }
  }

  async function onAmortize(data: AmortizeInput) {
    if (!openAmortize) return
    setLoadingAmortize(true)
    try {
      await fetchApi(`/api/credits/${openAmortize}/amortize`, { method: 'POST', body: JSON.stringify(data) })
      resetA()
      setOpenAmortize(null)
      toast.success('Amortização registada! Já aparece nas despesas como "Crédito".')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoadingAmortize(false) }
  }

  async function onDelete(id: string) {
    if (!confirm('Remover este crédito? As despesas associadas não serão removidas.')) return
    try {
      await fetchApi(`/api/credits/${id}`, { method: 'DELETE' })
      setCredits(prev => prev.filter(c => c.id !== id))
      toast.success('Crédito removido')
    } catch (e: any) { toast.error(e.message) }
  }

  // Total monthly commitment from all active credits
  const totalMonthlyCredits = credits
    .filter(c => c.status === 'active')
    .reduce((s: number, c: any) => s + Number(c.monthlyPayment), 0)

  const salaryCommitmentPct = monthlySalary > 0
    ? Math.round((totalMonthlyCredits / monthlySalary) * 100 * 10) / 10
    : 0

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      {credits.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="kanza-metric">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Compromisso Mensal Total</p>
            <p className="text-2xl font-bold font-mono text-expense">{formatKz(totalMonthlyCredits)}</p>
            <p className="text-xs text-muted-foreground mt-1">{credits.filter((c: any) => c.status === 'active').length} crédito(s) activo(s)</p>
          </div>
          <div className="kanza-metric">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">% do Salário Comprometida</p>
            <p className={`text-2xl font-bold font-mono ${salaryCommitmentPct <= 20 ? 'text-income' : salaryCommitmentPct <= 30 ? 'text-primary' : 'text-expense'}`}>
              {monthlySalary > 0 ? `${salaryCommitmentPct}%` : '— sem salário'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {salaryCommitmentPct <= 20 ? '✅ Dentro do limite saudável' : salaryCommitmentPct <= 30 ? '⚠️ Moderado' : '❌ Elevado — rever despesas'}
            </p>
          </div>
          <div className="kanza-metric">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Salário Mensal (base)</p>
            <p className="text-2xl font-bold font-mono text-income">{monthlySalary > 0 ? formatKz(monthlySalary) : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Soma das rendas de salário</p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
          + Novo Crédito
        </button>
      </div>

      {credits.length === 0 ? (
        <div className="kanza-card p-16 text-center">
          <div className="text-5xl mb-4">🏦</div>
          <h3 className="text-lg font-semibold mb-2">Sem créditos registados</h3>
          <p className="text-sm text-muted-foreground mb-6">Regista os teus créditos bancários para acompanhar prestações, saldo em dívida e impacto no salário.</p>
          <button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
            Registar primeiro crédito
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {credits.map((credit: any) => (
            <CreditCard
              key={credit.id}
              credit={credit}
              monthlySalary={monthlySalary}
              onAmortize={() => setOpenAmortize(credit.id)}
              onSchedule={() => setOpenSchedule(credit.id)}
              onDelete={() => onDelete(credit.id)}
            />
          ))}
        </div>
      )}

      {/* Create Credit Dialog */}
      <KanzaDialog open={openCreate} onOpenChange={setOpenCreate} title="Novo Crédito" description="Regista um crédito bancário ou dívida">
        <form onSubmit={hsC(onCreateCredit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Descrição *</label>
            <input {...regC('description')} placeholder="Ex: Crédito habitação BAI" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errC.description && <p className="text-xs text-destructive mt-1">{errC.description.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Banco / Entidade</label>
            <input {...regC('entity')} placeholder="Ex: BAI, BFA, BPC…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor Total (Kz) *</label>
              <input {...regC('totalAmount')} type="number" step="0.01" min="0" placeholder="18000000" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errC.totalAmount && <p className="text-xs text-destructive mt-1">{errC.totalAmount.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Mensalidade (Kz) *</label>
              <input {...regC('monthlyPayment')} type="number" step="0.01" min="0" placeholder="530000" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errC.monthlyPayment && <p className="text-xs text-destructive mt-1">{errC.monthlyPayment.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Duração (meses) *</label>
              <input {...regC('totalMonths')} type="number" min="1" placeholder="60" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errC.totalMonths && <p className="text-xs text-destructive mt-1">{errC.totalMonths.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Primeiro desconto *</label>
              <input {...regC('startDate')} type="date" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errC.startDate && <p className="text-xs text-destructive mt-1">{errC.startDate.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notas</label>
            <input {...regC('notes')} placeholder="Informação adicional…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button type="submit" disabled={loadingCreate} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {loadingCreate ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </KanzaDialog>

      {/* Amortize Dialog */}
      <KanzaDialog open={!!openAmortize} onOpenChange={v => !v && setOpenAmortize(null)} title="Registar Pagamento / Amortização" description="Regista um pagamento mensal ou um valor extra acima da prestação habitual">
        <form onSubmit={hsA(onAmortize)} className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
            💡 Se o valor for igual à mensalidade habitual, será registado como prestação normal. Se for superior, será marcado como <strong className="text-foreground">amortização extra</strong>. Ambos aparecem nas despesas como categoria <strong className="text-foreground">Crédito</strong>.
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor pago (Kz) *</label>
            <input {...regA('amount')} type="number" step="0.01" min="0.01" placeholder="530000" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errA.amount && <p className="text-xs text-destructive mt-1">{errA.amount.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Data do pagamento *</label>
            <input {...regA('date')} type="date" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errA.date && <p className="text-xs text-destructive mt-1">{errA.date.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notas</label>
            <input {...regA('notes')} placeholder="Ex: Bónus de Março aplicado…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpenAmortize(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button type="submit" disabled={loadingAmortize} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {loadingAmortize ? 'A registar…' : 'Registar'}
            </button>
          </div>
        </form>
      </KanzaDialog>

      {/* Schedule Dialog */}
      {openSchedule && (
        <ScheduleDialog
          credit={credits.find((c: any) => c.id === openSchedule)}
          onClose={() => setOpenSchedule(null)}
        />
      )}
    </div>
  )
}

// ─── Credit Card Component ────────────────────────────────────────────────────
function CreditCard({ credit, monthlySalary, onAmortize, onSchedule, onDelete }: {
  credit: any; monthlySalary: number
  onAmortize: () => void; onSchedule: () => void; onDelete: () => void
}) {
  const summary = useMemo(() => calcCreditSummary(
    Number(credit.totalAmount),
    Number(credit.monthlyPayment),
    credit.totalMonths,
    new Date(credit.startDate),
    [],
    monthlySalary,
    credit.status,
  ), [credit, monthlySalary])

  const impact = creditSalaryImpactLabel(summary.salaryImpactPct)
  const progressColor = summary.progressPct >= 75 ? '#3ecf8e' : summary.progressPct >= 40 ? '#e8b84b' : '#5b8ff9'

  return (
    <div className="kanza-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏦</span>
            <h3 className="font-bold text-base">{credit.description}</h3>
            {credit.entity && (
              <span className="text-xs bg-accent px-2 py-0.5 rounded-full text-muted-foreground">{credit.entity}</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${credit.status === 'active' ? 'bg-income/10 text-income' : 'bg-muted text-muted-foreground'}`}>
              {credit.status === 'active' ? '● Activo' : credit.status === 'paid' ? '✓ Pago' : '⏸ Pausado'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Início: {format(new Date(credit.startDate), "d 'de' MMMM 'de' yyyy", { locale: pt })}
          </p>
        </div>
        <button onClick={onDelete} className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10">
          Remover
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progresso do pagamento</span>
          <span className="font-mono font-bold" style={{ color: progressColor }}>{summary.progressPct.toFixed(1)}% pago</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${summary.progressPct}%`, background: progressColor }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>{formatKz(summary.totalPaid)} pagos</span>
          <span>{formatKz(summary.totalRemaining)} restantes</span>
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Valor do crédito', value: formatKz(summary.totalAmount), color: 'text-foreground' },
          { label: 'Mensalidade', value: formatKz(summary.monthlyPayment), color: 'text-expense' },
          { label: 'Já pago', value: formatKz(summary.totalPaid), color: 'text-income' },
          { label: 'Ainda em dívida', value: formatKz(summary.totalRemaining), color: 'text-expense' },
          { label: 'Meses decorridos', value: `${summary.monthsElapsed} de ${summary.totalMonths}`, color: 'text-foreground' },
          { label: 'Tempo restante', value: summary.remainingLabel, color: summary.monthsRemaining <= 6 ? 'text-income' : 'text-foreground' },
          { label: 'Data prevista de fim', value: format(summary.projectedEndDate, "MMM yyyy", { locale: pt }), color: 'text-primary' },
          { label: '% do salário', value: monthlySalary > 0 ? `${summary.salaryImpactPct}%` : '—', color: impact.severity === 'safe' ? 'text-income' : impact.severity === 'warning' ? 'text-primary' : 'text-expense' },
        ].map(m => (
          <div key={m.label} className="bg-accent/30 rounded-xl p-3">
            <p className="text-[10px] text-muted-foreground mb-1 leading-tight">{m.label}</p>
            <p className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Remaining time breakdown */}
      <div className="bg-accent/20 rounded-xl p-4 mb-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xl font-bold font-mono text-primary">{summary.monthsRemaining}</p>
          <p className="text-xs text-muted-foreground mt-0.5">meses restantes</p>
        </div>
        <div>
          <p className="text-xl font-bold font-mono text-primary">{summary.daysRemaining.toLocaleString('pt-AO')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">dias restantes</p>
        </div>
        <div>
          <p className="text-xl font-bold font-mono text-primary">{summary.yearsRemaining.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">anos restantes</p>
        </div>
      </div>

      {/* Salary impact */}
      {monthlySalary > 0 && (
        <div className={`rounded-xl p-4 mb-4 border ${
          impact.severity === 'safe' ? 'bg-income/5 border-income/20' :
          impact.severity === 'warning' ? 'bg-primary/5 border-primary/20' :
          'bg-expense/5 border-expense/20'
        }`}>
          <p className="text-xs font-semibold mb-1">
            {impact.severity === 'safe' ? '✅' : impact.severity === 'warning' ? '⚠️' : '❌'} Impacto no Salário
          </p>
          <p className="text-xs text-muted-foreground">{impact.label}</p>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Salário:</span>
            <span className="font-mono font-semibold text-income">{formatKz(monthlySalary)}</span>
            <span className="text-muted-foreground">→ Prestação:</span>
            <span className="font-mono font-semibold text-expense">{formatKz(summary.monthlyPayment)}</span>
            <span className="text-muted-foreground">= Fica disponível:</span>
            <span className="font-mono font-semibold">{formatKz(monthlySalary - summary.monthlyPayment)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onAmortize} className="flex-1 bg-primary/10 text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-all">
          💳 Registar Pagamento
        </button>
        <button onClick={onSchedule} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-medium hover:bg-accent transition-all">
          📋 Ver Plano de Pagamento
        </button>
      </div>
    </div>
  )
}

// ─── Amortization Schedule Dialog ────────────────────────────────────────────
function ScheduleDialog({ credit, onClose }: { credit: any; onClose: () => void }) {
  const rows = useMemo(() => buildAmortizationSchedule(
    Number(credit.totalAmount),
    Number(credit.monthlyPayment),
    credit.totalMonths,
    new Date(credit.startDate),
  ), [credit])

  const currentIdx = rows.findIndex(r => r.isCurrent)
  const displayRows = rows.slice(0, 24) // show first 24 months

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">{credit.description} — Plano de Pagamento</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{credit.totalMonths} prestações de {formatKz(Number(credit.monthlyPayment))}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-semibold uppercase tracking-wider">Nº</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-semibold uppercase tracking-wider">Data</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-semibold uppercase tracking-wider">Prestação</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-semibold uppercase tracking-wider">Saldo Restante</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-semibold uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`border-b border-border last:border-0 ${row.isCurrent ? 'bg-primary/10' : row.isPast ? 'opacity-50' : ''}`}>
                  <td className="py-2.5 px-3 font-mono">{row.month}</td>
                  <td className="py-2.5 px-3">{format(row.date, 'MMM yyyy', { locale: pt })}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-expense">
                    {formatKz(row.payment)}
                    {row.extra > 0 && <span className="ml-1 text-income text-[10px]">+{formatKz(row.extra)}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatKz(row.remaining)}</td>
                  <td className="py-2.5 px-3 text-center">
                    {row.isCurrent ? <span className="text-primary font-semibold">● Actual</span>
                      : row.isPast ? <span className="text-income">✓ Pago</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 24 && (
            <p className="text-xs text-center text-muted-foreground py-3">... e mais {rows.length - 24} prestações</p>
          )}
        </div>
      </div>
    </div>
  )
}
