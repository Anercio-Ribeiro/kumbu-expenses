'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { loginSchema, type LoginInput } from '@/lib/validators'
import { cn } from '@/lib/utils'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    try {
      const res = await signIn('credentials', { ...data, redirect: false })
      if (res?.error) {
        toast.error('Email ou palavra-passe incorrectos')
        setLoading(false)
      } else {
        // Keep loading=true — we stay on loading screen while redirecting
        toast.success('Bem-vindo ao Kanza!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Erro de ligação. Tenta novamente.')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Full-screen loading overlay while authenticating */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl animate-pulse">
            ₾
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">A entrar na tua conta…</p>
            <p className="text-sm text-muted-foreground mt-1">A verificar credenciais e a carregar os dados</p>
          </div>
          <Spinner />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="joao@exemplo.ao"
            disabled={loading}
            className={cn(
              'w-full bg-card border rounded-xl px-4 py-3 text-sm outline-none transition-all',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50',
              errors.email ? 'border-destructive' : 'border-border',
            )}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Palavra-passe
          </label>
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            disabled={loading}
            className={cn(
              'w-full bg-card border rounded-xl px-4 py-3 text-sm outline-none transition-all',
              'focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50',
              errors.password ? 'border-destructive' : 'border-border',
            )}
          />
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              A entrar…
            </>
          ) : 'Entrar'}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Não tens conta?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </>
  )
}

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-[3px]'
  return (
    <div
      className={`${s} rounded-full border-primary/30 border-t-primary animate-spin`}
      style={{ animationDuration: '0.7s' }}
    />
  )
}
