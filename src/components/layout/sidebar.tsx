import { getCurrentUser } from '@/lib/auth/session'
import { SidebarClient } from './sidebar-client'
import { getInitials } from '@/lib/utils'

// Nav items — labels are translation keys, client handles locale switching
export const NAV_ITEMS = [
  { href: '/dashboard', icon: '◈', labelPt: 'Dashboard', labelEn: 'Dashboard', group: 'Principal' },
  { href: '/income', icon: '↑', labelPt: 'Rendas', labelEn: 'Income', group: 'Principal' },
  { href: '/expenses', icon: '↓', labelPt: 'Despesas', labelEn: 'Expenses', group: 'Principal' },
  { href: '/categories', icon: '◎', labelPt: 'Categorias', labelEn: 'Categories', group: 'Análise' },
  { href: '/categories/manage', icon: '⊞', labelPt: 'Gerir Categorias', labelEn: 'Manage Categories', group: 'Análise' },
  { href: '/statistics', icon: '≈', labelPt: 'Estatísticas', labelEn: 'Statistics', group: 'Análise' },
  { href: '/savings', icon: '◆', labelPt: 'Poupanças', labelEn: 'Savings', group: 'Planeamento' },
  { href: '/goals', icon: '◉', labelPt: 'Objectivos', labelEn: 'Goals', group: 'Planeamento' },
  { href: '/children', icon: '🧒', labelPt: 'Filhos', labelEn: 'Children', group: 'Planeamento' },
  { href: '/credits', icon: '🏦', labelPt: 'Créditos', labelEn: 'Credits', group: 'Finanças' },
  { href: '/debts', icon: '⚠', labelPt: 'Dívidas', labelEn: 'Debts', group: 'Finanças' },
  { href: '/loans', icon: '🤝', labelPt: 'Empréstimos', labelEn: 'Loans Given', group: 'Finanças' },
  { href: '/tips', icon: '✦', labelPt: 'Dicas', labelEn: 'Tips', group: 'Mais' },
  { href: '/settings', icon: '⚙', labelPt: 'Definições', labelEn: 'Settings', group: 'Mais' },
]

export async function Sidebar() {
  const user = await getCurrentUser()
  return (
    <SidebarClient
      nav={NAV_ITEMS}
      user={{ name: user.name, email: user.email, initials: getInitials(user.name) }}
    />
  )
}
