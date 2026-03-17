'use client'

import { useTheme } from 'next-themes'
import { getInitials, stringToColor } from '@/lib/utils'

export function SettingsClient({ user }: { user: { id: string; name: string; email: string } }) {
  const { theme, setTheme } = useTheme()
  const initials = getInitials(user.name)
  const color = stringToColor(user.name)

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-4">Perfil</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: color }}>
            {initials}
          </div>
          <div>
            <p className="font-semibold text-lg">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-accent/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Moeda</p>
            <p className="font-semibold">Kwanza (AOA)</p>
          </div>
          <div className="bg-accent/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Localização</p>
            <p className="font-semibold">Luanda, Angola</p>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-4">Aparência</h2>
        <p className="text-sm text-muted-foreground mb-4">Escolhe o tema que preferes para a interface</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Claro', icon: '☀️' },
            { value: 'dark', label: 'Escuro', icon: '🌙' },
            { value: 'system', label: 'Sistema', icon: '💻' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                theme === t.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40 hover:bg-accent/40'
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="kanza-card p-6">
        <h2 className="font-semibold mb-3">Sobre o Kanza</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Versão: 1.0.0</p>
          <p>Stack: Next.js 15 · TypeScript · Drizzle ORM · Neon PostgreSQL</p>
          <p>Moeda: Kwanza Angolano (AOA)</p>
          <p>Locale: Português (Angola)</p>
        </div>
      </div>
    </div>
  )
}
