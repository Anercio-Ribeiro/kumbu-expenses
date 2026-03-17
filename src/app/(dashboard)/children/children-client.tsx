'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateChild } from '@/lib/hooks/use-api'
import { childSchema, type ChildInput } from '@/lib/validators'
import { formatKz, getChildAge } from '@/lib/utils/finance'
import { KanzaDialog } from '@/components/ui/dialog'
import { stringToColor } from '@/lib/utils'
import Link from 'next/link'

interface ChildWithStats {
  id: string
  name: string
  birthDate: Date
  notes?: string | null
  totalSpent: number
}

export function ChildrenClient({ initialChildren }: { initialChildren: ChildWithStats[] }) {
  const [children, setChildren] = useState(initialChildren)
  const [open, setOpen] = useState(false)
  const create = useCreateChild()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChildInput>({
    resolver: zodResolver(childSchema),
  })

  async function onSubmit(data: ChildInput) {
    const result = await create.mutateAsync(data) as any
    setChildren(prev => [...prev, { ...result.child, totalSpent: 0 }])
    reset()
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
        >
          + Adicionar Filho/a
        </button>
      </div>

      {children.length === 0 ? (
        <div className="kanza-card p-16 text-center">
          <div className="text-5xl mb-4">🧒</div>
          <h3 className="text-lg font-semibold mb-2">Sem filhos registados</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Adiciona os teus filhos para acompanhar gastos e criar planos financeiros para o futuro deles.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            Adicionar primeiro filho
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map(child => {
            const age = getChildAge(child.birthDate)
            const color = stringToColor(child.name)
            return (
              <div key={child.id} className="kanza-card p-6 hover:border-primary/40 transition-all">
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                    style={{ background: color }}
                  >
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{child.name}</h3>
                    <p className="text-sm text-muted-foreground">{age.label}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-xs text-muted-foreground">Total gasto</span>
                    <span className="font-mono font-bold text-expense text-sm">
                      {formatKz(child.totalSpent)}
                    </span>
                  </div>
                  {child.notes && (
                    <p className="text-xs text-muted-foreground italic">{child.notes}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/expenses?childId=${child.id}`}
                    className="text-center py-2 rounded-lg border border-border text-xs font-medium hover:bg-accent transition-all"
                  >
                    Ver despesas
                  </Link>
                  <Link
                    href={`/goals?childId=${child.id}`}
                    className="text-center py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
                  >
                    Objectivos
                  </Link>
                </div>
              </div>
            )
          })}

          {/* Add card */}
          <button
            onClick={() => setOpen(true)}
            className="kanza-card p-6 border-dashed border-2 flex flex-col items-center justify-center gap-3 h-48 hover:border-primary/40 hover:bg-accent/20 transition-all text-muted-foreground hover:text-foreground"
          >
            <span className="text-3xl">+</span>
            <span className="text-sm font-medium">Adicionar filho/a</span>
          </button>
        </div>
      )}

      {/* Tips section */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-4">💡 Dicas de Planeamento para Filhos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: '📚',
              title: 'Fundo de Educação',
              desc: 'Começa a poupar cedo para a universidade. Mesmo pequenas quantias mensais fazem grande diferença ao longo dos anos.',
            },
            {
              icon: '🏥',
              title: 'Seguro de Saúde',
              desc: 'Inclui os filhos num plano de saúde familiar. Acompanha as despesas médicas para otimizar a cobertura.',
            },
            {
              icon: '🎯',
              title: 'Objectivos a Longo Prazo',
              desc: 'Cria objectivos específicos para cada filho — casa, negócio, viagem de formatura.',
            },
          ].map(tip => (
            <div key={tip.title} className="flex gap-3 p-4 bg-accent/30 rounded-xl">
              <span className="text-2xl flex-shrink-0">{tip.icon}</span>
              <div>
                <p className="text-sm font-semibold mb-1">{tip.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Child Dialog */}
      <KanzaDialog open={open} onOpenChange={setOpen} title="Adicionar Filho/a" description="Regista um filho para gerir gastos e planos financeiros">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome *</label>
            <input
              {...register('name')}
              placeholder="Nome do filho/a"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Data de Nascimento *</label>
            <input
              {...register('birthDate')}
              type="date"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {errors.birthDate && <p className="text-xs text-destructive mt-1">{errors.birthDate.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notas</label>
            <textarea
              {...register('notes')}
              placeholder="Notas adicionais..."
              rows={2}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={create.isPending} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
              {create.isPending ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </KanzaDialog>
    </div>
  )
}
