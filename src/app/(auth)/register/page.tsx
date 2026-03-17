import { Metadata } from 'next'
import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Criar Conta' }

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">₾</div>
          <span className="text-2xl font-bold">Kanza<span className="text-primary">.</span></span>
        </div>
        <h1 className="text-2xl font-bold mb-1">Criar conta gratuita</h1>
        <p className="text-muted-foreground text-sm mb-8">Começa a controlar as tuas finanças hoje</p>
        <RegisterForm />
      </div>
    </div>
  )
}
