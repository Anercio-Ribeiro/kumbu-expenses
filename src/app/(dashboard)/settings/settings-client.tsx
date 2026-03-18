'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { getInitials, stringToColor } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'
import { type Locale } from '@/lib/i18n/translations'

export function SettingsClient({ user }: { user: { id: string; name: string; email: string } }) {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useI18n()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const initials = getInitials(user.name)
  const color = stringToColor(user.name)

  const themes = [
    { value: 'light', label: t('lightMode'), icon: '☀️' },
    { value: 'dark', label: t('darkMode'), icon: '🌙' },
    { value: 'system', label: t('systemMode'), icon: '💻' },
  ]

  const langs: { value: Locale; label: string; flag: string }[] = [
    { value: 'pt', label: 'Português', flag: '🇦🇴' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
  ]

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-4">
          {locale === 'pt' ? 'Perfil' : 'Profile'}
        </h2>
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
            style={{ background: color }}
          >
            {initials}
          </div>
          <div>
            <p className="font-semibold text-lg">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-accent/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-0.5">
              {locale === 'pt' ? 'Moeda' : 'Currency'}
            </p>
            <p className="font-semibold">🇦🇴 Kwanza (AOA)</p>
          </div>
          <div className="bg-accent/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-0.5">
              {locale === 'pt' ? 'Localização' : 'Location'}
            </p>
            <p className="font-semibold">Luanda, Angola</p>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-1">{t('language')}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {locale === 'pt' ? 'Escolhe o idioma da interface' : 'Choose the interface language'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {langs.map(lang => (
            <button
              key={lang.value}
              onClick={() => setLocale(lang.value)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                locale === lang.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40 hover:bg-accent/40'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span>{lang.label}</span>
              {locale === lang.value && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-1">{t('appearance')}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {locale === 'pt' ? 'Escolhe o tema que preferes para a interface' : 'Choose your preferred interface theme'}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(th => (
            <button
              key={th.value}
              onClick={() => setTheme(th.value)}
              suppressHydrationWarning
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                mounted && theme === th.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40 hover:bg-accent/40'
              }`}
            >
              <span className="text-2xl">{th.icon}</span>
              <span suppressHydrationWarning>{th.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-3">
          {locale === 'pt' ? 'Sobre o Kanza' : 'About Kanza'}
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{locale === 'pt' ? 'Versão' : 'Version'}: 1.0.0</p>
          <p>Stack: Next.js 15 · TypeScript · Drizzle ORM · Neon PostgreSQL</p>
          <p>{locale === 'pt' ? 'Moeda' : 'Currency'}: Kwanza Angolano (AOA)</p>
        </div>
      </div>
    </div>
  )
}
