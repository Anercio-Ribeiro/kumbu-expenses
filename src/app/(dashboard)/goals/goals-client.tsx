'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateGoal, useAddContribution } from '@/lib/hooks/use-api'
import { goalSchema, contributionSchema, type GoalInput, type ContributionInput } from '@/lib/validators'
import { formatKz, calcGoalProjection } from '@/lib/utils/finance'
import { GoalRing } from '@/components/goals/goal-ring'
import { KanzaDialog } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const ICONS = ['🎯', '🚗', '🏠', '✈️', '📱', '🎓', '💍', '💼', '🛡️', '🎮', '🏋️', '🌍']
const today = new Date().toISOString().split('T')[0]

export function GoalsClient({
  initialGoals,
  monthlySavings,
  children,
}: {
  initialGoals: any[]
  monthlySavings: number
  children: any[]
}) {
  const [goals, setGoals] = useState(initialGoals)
  const [openCreate, setOpenCreate] = useState(false)
  const [openContrib, setOpenContrib] = useState<string | null>(null)

  const createGoal = useCreateGoal()
  const addContrib = useAddContribution()

  const { register: regGoal, handleSubmit: hsGoal, reset: resetGoal, watch: watchGoal, formState: { errors: errGoal } } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: { icon: '🎯', currentAmount: 0 },
  })
  const { register: regContrib, handleSubmit: hsContrib, reset: resetContrib, formState: { errors: errContrib } } = useForm<ContributionInput>({
    resolver: zodResolver(contributionSchema),
  })

  const selectedIcon = watchGoal('icon') ?? '🎯'

  async function onCreateGoal(data: GoalInput) {
    const result = await createGoal.mutateAsync(data) as any
    setGoals(prev => [...prev, { ...result.goal, contributions: [], child: children.find(c => c.id === data.childId) }])
    resetGoal()
    setOpenCreate(false)
  }

  async function onContribute(data: ContributionInput) {
    if (!openContrib) return
    await addContrib.mutateAsync({ goalId: openContrib, data })
    setGoals(prev => prev.map(g => {
      if (g.id !== openContrib) return g
      const newAmount = Math.min(Number(g.currentAmount) + data.amount, Number(g.targetAmount))
      return { ...g, currentAmount: newAmount.toFixed(2) }
    }))
    resetContrib()
    setOpenContrib(null)
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return (
    <div className="space-y-8">
      {/* Monthly savings context */}
      <div className="kanza-card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Poupança mensal actual</p>
          <p className="text-2xl font-bold font-mono text-income mt-1">{formatKz(monthlySavings)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Usado como base para as projecções abaixo</p>
        </div>
        <button
          onClick={() => setOpenCreate(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex-shrink-0"
        >
          + Novo Objectivo
        </button>
      </div>

      {/* Active goals */}
      {activeGoals.length === 0 ? (
        <div className="kanza-card p-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold mb-2">Sem objectivos activos</h3>
          <p className="text-sm text-muted-foreground mb-6">Cria o teu primeiro objectivo financeiro e começa a trabalhar para o alcançar.</p>
          <button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
            Criar primeiro objectivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeGoals.map(goal => {
            const proj = calcGoalProjection(
              Number(goal.targetAmount),
              Number(goal.currentAmount),
              new Date(goal.targetDate),
              monthlySavings,
            )
            return (
              <div key={goal.id} className={`kanza-card p-6 ${proj.isOnTrack ? 'hover:border-income/40' : 'hover:border-expense/40'} transition-all`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-3xl mb-1">{goal.icon}</div>
                    <h3 className="font-bold text-base">{goal.name}</h3>
                    {goal.child && (
                      <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full mt-1 inline-block">
                        👶 {goal.child.name}
                      </span>
                    )}
                    {goal.description && (
                      <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${proj.isOnTrack ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                    {proj.isOnTrack ? '✅ No prazo' : '⚠️ Em risco'}
                  </span>
                </div>

                <GoalRing
                  targetAmount={Number(goal.targetAmount)}
                  currentAmount={Number(goal.currentAmount)}
                  targetDate={new Date(goal.targetDate)}
                  currentMonthlySavings={monthlySavings}
                  size={120}
                  strokeWidth={10}
                />

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-xs text-muted-foreground mb-3">
                    <span>Prazo: {format(new Date(goal.targetDate), "d MMM yyyy", { locale: pt })}</span>
                    <span>Meta: {formatKz(Number(goal.targetAmount))}</span>
                  </div>
                  <button
                    onClick={() => setOpenContrib(goal.id)}
                    className="w-full py-2 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-all"
                  >
                    + Registar Contribuição
                  </button>
                </div>

                {/* Recent contributions */}
                {goal.contributions?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Últimas contribuições</p>
                    {goal.contributions.slice(0, 2).map((c: any) => (
                      <div key={c.id} className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">{format(new Date(c.contributedAt), 'd MMM', { locale: pt })}</span>
                        <span className="font-mono font-semibold text-income">+{formatKz(Number(c.amount))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Add goal card */}
          <button
            onClick={() => setOpenCreate(true)}
            className="kanza-card p-6 border-dashed border-2 flex flex-col items-center justify-center gap-3 min-h-[280px] hover:border-primary/50 hover:bg-accent/20 transition-all text-muted-foreground hover:text-foreground"
          >
            <span className="text-3xl">+</span>
            <span className="text-sm font-medium">Novo objectivo</span>
          </button>
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">🏆 Objectivos Concluídos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {completedGoals.map(goal => (
              <div key={goal.id} className="kanza-card p-4 opacity-70 flex items-center gap-3">
                <span className="text-2xl">{goal.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{goal.name}</p>
                  <p className="text-xs text-income font-mono">+{formatKz(Number(goal.targetAmount))} ✅</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Dialog */}
      <KanzaDialog open={openCreate} onOpenChange={setOpenCreate} title="Novo Objectivo" description="Define uma meta financeira para alcançar">
        <form onSubmit={hsGoal(onCreateGoal)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <label key={icon} className="cursor-pointer">
                  <input type="radio" {...regGoal('icon')} value={icon} className="sr-only" />
                  <span className={`w-10 h-10 text-lg flex items-center justify-center rounded-xl border transition-all ${selectedIcon === icon ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}`}>
                    {icon}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome *</label>
            <input {...regGoal('name')} placeholder="Ex: Carro novo, Viagem…" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errGoal.name && <p className="text-xs text-destructive mt-1">{errGoal.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor Alvo (Kz) *</label>
              <input {...regGoal('targetAmount')} type="number" step="0.01" min="0" placeholder="18000000" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errGoal.targetAmount && <p className="text-xs text-destructive mt-1">{errGoal.targetAmount.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Já Poupado (Kz)</label>
              <input {...regGoal('currentAmount')} type="number" step="0.01" min="0" placeholder="0" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Prazo *</label>
              <input {...regGoal('targetDate')} type="date" min={today} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              {errGoal.targetDate && <p className="text-xs text-destructive mt-1">{errGoal.targetDate.message}</p>}
            </div>
            {children.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Filho/a</label>
                <select {...regGoal('childId')} className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option value="">Nenhum</option>
                  {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Descrição</label>
            <input {...regGoal('description')} placeholder="Descrição do objectivo..." className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button type="submit" disabled={createGoal.isPending} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {createGoal.isPending ? 'A criar…' : 'Criar Objectivo'}
            </button>
          </div>
        </form>
      </KanzaDialog>

      {/* Contribution Dialog */}
      <KanzaDialog open={!!openContrib} onOpenChange={v => !v && setOpenContrib(null)} title="Registar Contribuição">
        <form onSubmit={hsContrib(onContribute)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Valor (Kz) *</label>
            <input {...regContrib('amount')} type="number" step="0.01" min="0.01" placeholder="0" className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {errContrib.amount && <p className="text-xs text-destructive mt-1">{errContrib.amount.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notas</label>
            <input {...regContrib('notes')} placeholder="Ex: Bónus de Março..." className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpenContrib(null)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">Cancelar</button>
            <button type="submit" disabled={addContrib.isPending} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {addContrib.isPending ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </KanzaDialog>
    </div>
  )
}
