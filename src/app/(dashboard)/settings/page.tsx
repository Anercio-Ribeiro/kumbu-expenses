import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/session'
import { PageHeader } from '@/components/ui/page-header'
import { SettingsClient } from './settings-client'

export const metadata: Metadata = { title: 'Definições' }

export default async function SettingsPage() {
  const user = await getCurrentUser()
  return (
    <div className="animate-fade-in">
      <PageHeader title="Definições" subtitle="Personaliza a tua experiência no Kanza" />
      <SettingsClient user={user} />
    </div>
  )
}
