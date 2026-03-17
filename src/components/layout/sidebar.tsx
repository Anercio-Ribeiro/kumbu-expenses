import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/session'
import { SidebarClient } from './sidebar-client'
import { getInitials } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: '◈', label: 'Dashboard', group: 'Principal' },
  { href: '/income', icon: '↑', label: 'Rendas', group: 'Principal' },
  { href: '/expenses', icon: '↓', label: 'Despesas', group: 'Principal' },
  { href: '/categories', icon: '◎', label: 'Categorias', group: 'Análise' },
  { href: '/categories/manage', icon: '⊞', label: 'Gerir Categorias', group: 'Análise' },
  { href: '/statistics', icon: '≈', label: 'Estatísticas', group: 'Análise' },
  { href: '/savings', icon: '◆', label: 'Poupanças', group: 'Planeamento' },
  { href: '/goals', icon: '◉', label: 'Objectivos', group: 'Planeamento' },
  { href: '/children', icon: '🧒', label: 'Filhos', group: 'Planeamento' },
  { href: '/credits', icon: '🏦', label: 'Créditos', group: 'Planeamento' },
  { href: '/tips', icon: '✦', label: 'Dicas', group: 'Planeamento' },
  { href: '/settings', icon: '⚙', label: 'Definições', group: 'Conta' },
]

export async function Sidebar() {
  const user = await getCurrentUser()
  return <SidebarClient nav={NAV} user={{ name: user.name, email: user.email, initials: getInitials(user.name) }} />
}
