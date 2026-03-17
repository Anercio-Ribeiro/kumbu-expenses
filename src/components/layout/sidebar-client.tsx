'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

type NavItem = { href: string; icon: string; label: string; group: string }
type User = { name: string; email: string; initials: string }

const GROUPS = ['Principal', 'Análise', 'Planeamento', 'Conta']

export function SidebarClient({ nav, user }: { nav: NavItem[]; user: User }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  // Only read theme after client mount to avoid SSR/client mismatch
  useEffect(() => { setMounted(true) }, [])
  const isDark = mounted ? theme === 'dark' : true

  async function handleSignOut() {
    setSigningOut(true)
    // Fire event so the full-screen overlay (in layout) can show immediately
    window.dispatchEvent(new Event('kanza:signing-out'))
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-50 flex flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-[64px]' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
          ₾
        </div>
        {!collapsed && (
          <span className="text-xl font-bold tracking-tight">
            Kanza<span className="text-primary">.</span>
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={cn('ml-auto text-muted-foreground hover:text-foreground transition-colors', collapsed && 'mx-auto ml-auto')}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
        {GROUPS.map(group => {
          const items = nav.filter(n => n.group === group)
          if (!items.length) return null
          return (
            <div key={group} className="mb-4">
              {!collapsed && (
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase px-2 mb-1">
                  {group}
                </p>
              )}
              {items.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                      collapsed && 'justify-center px-2',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={cn('text-base w-5 text-center flex-shrink-0', active && 'text-primary')}>
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-2">
        {/* Theme toggle — suppressHydrationWarning prevents SSR mismatch */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all',
            collapsed && 'justify-center',
          )}
          title="Alternar tema"
          suppressHydrationWarning
        >
          <span className="text-base w-5 text-center" suppressHydrationWarning>
            {mounted ? (isDark ? '☀️' : '☾') : '◐'}
          </span>
          {!collapsed && (
            <span suppressHydrationWarning>
              {mounted ? (isDark ? 'Modo Claro' : 'Modo Escuro') : 'Tema'}
            </span>
          )}
        </button>

                {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-70',
            signingOut
              ? 'text-muted-foreground cursor-not-allowed'
              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            collapsed && 'justify-center',
          )}
          title="Terminar sessão"
        >
          {signingOut ? (
            <>
              <span className="w-5 flex justify-center">
                <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin inline-block" style={{animationDuration:'0.7s'}} />
              </span>
              {!collapsed && <span>A sair…</span>}
            </>
          ) : (
            <>
              <span className="text-base w-5 text-center">⎋</span>
              {!collapsed && <span>Terminar Sessão</span>}
            </>
          )}
        </button>

        {/* Profile */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50 mt-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
            >
              {user.initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
