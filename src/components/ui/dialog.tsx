'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

interface KanzaDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function KanzaDialog({ open, onOpenChange, title, description, children, className }: KanzaDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-md',
            'animate-fade-in',
            className,
          )}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <Dialog.Title className="text-lg font-bold text-foreground">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-muted-foreground mt-0.5">{description}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent">
              ✕
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
