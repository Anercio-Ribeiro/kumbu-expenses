'use client'

import { useState, useEffect } from 'react'

/**
 * Shows a full-screen loading overlay while NextAuth is redirecting after signOut.
 * Listens to a custom event fired by sidebar-client.
 */
export function SignOutOverlay() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(true)
    window.addEventListener('kanza:signing-out', handler)
    return () => window.removeEventListener('kanza:signing-out', handler)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
        ₾
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground text-lg">A terminar sessão…</p>
        <p className="text-sm text-muted-foreground mt-1">A limpar os dados e a redirecionar</p>
      </div>
      <div
        className="w-8 h-8 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin"
        style={{ animationDuration: '0.7s' }}
      />
    </div>
  )
}
