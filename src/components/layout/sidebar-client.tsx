'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

type NavItem = { href: string; icon: string; labelPt: string; labelEn: string; group: string }
type User = { name: string; email: string; initials: string }

const GROUPS = ['Principal', 'Análise', 'Planeamento', 'Finanças', 'Mais']
const GROUP_LABELS: Record<string, { pt: string; en: string }> = {
  'Principal': { pt: 'Principal', en: 'Main' },
  'Análise': { pt: 'Análise', en: 'Analysis' },
  'Planeamento': { pt: 'Planeamento', en: 'Planning' },
  'Finanças': { pt: 'Finanças', en: 'Finances' },
  'Mais': { pt: 'Mais', en: 'More' },
}

export function SidebarClient({ nav, user }: { nav: NavItem[]; user: User }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { locale } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted ? theme === 'dark' : true

  async function handleSignOut() {
    setSigningOut(true)
    window.dispatchEvent(new Event('kanza:signing-out'))
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen z-50 flex flex-col border-r border-border bg-card transition-all duration-300',
      collapsed ? 'w-[64px]' : 'w-[240px]',
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
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
          className={cn('ml-auto text-muted-foreground hover:text-foreground transition-colors text-sm', collapsed && 'mx-auto')}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar">
        {GROUPS.map(group => {
          const items = nav.filter(n => n.group === group)
          if (!items.length) return null
          const groupLabel = GROUP_LABELS[group]?.[locale] ?? group
          return (
            <div key={group} className="mb-3">
              {!collapsed && (
                <p className="text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase px-2 mb-1">
                  {groupLabel}
                </p>
              )}
              {items.map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
                const label = locale === 'en' ? item.labelEn : item.labelPt
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5',
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                      collapsed && 'justify-center px-2',
                    )}
                    title={collapsed ? label : undefined}
                  >
                    <span className={cn('text-base w-5 text-center flex-shrink-0', active && 'text-primary')}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all', collapsed && 'justify-center')}
          suppressHydrationWarning
        >
          <span className="text-base w-5 text-center" suppressHydrationWarning>
            {mounted ? (isDark ? '☀' : '☾') : '◐'}
          </span>
          {!collapsed && (
            <span suppressHydrationWarning>
              {mounted ? (isDark ? (locale === 'pt' ? 'Modo Claro' : 'Light Mode') : (locale === 'pt' ? 'Modo Escuro' : 'Dark Mode')) : '…'}
            </span>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-70',
            signingOut ? 'text-muted-foreground cursor-not-allowed' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
            collapsed && 'justify-center',
          )}
        >
          {signingOut ? (
            <>
              <span className="w-5 flex justify-center">
                <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin inline-block" style={{ animationDuration: '0.7s' }} />
              </span>
              {!collapsed && <span>{locale === 'pt' ? 'A sair…' : 'Signing out…'}</span>}
            </>
          ) : (
            <>
              <span className="text-base w-5 text-center">⎋</span>
              {!collapsed && <span>{locale === 'pt' ? 'Terminar Sessão' : 'Sign Out'}</span>}
            </>
          )}
        </button>

        {/* Profile */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50 mt-1">
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
