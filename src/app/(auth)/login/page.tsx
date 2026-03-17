import { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">₾</div>
          <span className="text-2xl font-bold">Kanza<span className="text-primary">.</span></span>
        </div>
        <div>
          <blockquote className="text-3xl font-bold leading-tight text-foreground mb-6">
            "Controla o teu dinheiro.<br />
            <span className="text-primary">Constrói o teu futuro.</span>"
          </blockquote>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '📊', label: 'Análise em tempo real', desc: 'Estatísticas precisas dos teus gastos' },
              { icon: '🎯', label: 'Objectivos financeiros', desc: 'Acompanha cada meta com precisão' },
              { icon: '🧒', label: 'Planeamento familiar', desc: 'Inclui gastos e planos para filhos' },
              { icon: '💡', label: 'Dicas personalizadas', desc: 'Sugestões baseadas nos teus dados' },
            ].map(f => (
              <div key={f.label} className="bg-background/50 rounded-xl p-4 border border-border">
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-sm font-semibold text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 Kanza. Todos os direitos reservados.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">₾</div>
            <span className="text-xl font-bold">Kanza<span className="text-primary">.</span></span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Bem-vindo de volta</h1>
          <p className="text-muted-foreground text-sm mb-8">Entra na tua conta para continuar</p>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
