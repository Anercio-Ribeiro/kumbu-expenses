'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { registerSchema, type RegisterInput } from '@/lib/validators'
import { cn } from '@/lib/utils'

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao criar conta')
        return
      }
      toast.success('Conta criada! Faz login para entrar.')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'name' as const, label: 'Nome completo', type: 'text', placeholder: 'João António' },
    { name: 'email' as const, label: 'Email', type: 'email', placeholder: 'joao@exemplo.ao' },
    { name: 'password' as const, label: 'Palavra-passe', type: 'password', placeholder: '••••••••' },
    { name: 'confirmPassword' as const, label: 'Confirmar palavra-passe', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map(f => (
        <div key={f.name}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{f.label}</label>
          <input
            {...register(f.name)}
            type={f.type}
            placeholder={f.placeholder}
            className={cn(
              'w-full bg-card border rounded-xl px-4 py-3 text-sm outline-none transition-all',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary',
              errors[f.name] ? 'border-destructive' : 'border-border',
            )}
          />
          {errors[f.name] && <p className="text-xs text-destructive mt-1">{errors[f.name]?.message}</p>}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 mt-2"
      >
        {loading ? 'A criar conta…' : 'Criar conta'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Já tens conta?{' '}
        <Link href="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
      </p>
    </form>
  )
}
