import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-8', className)}>
      <div>
        <h1 className="kanza-page-title">{title}</h1>
        {subtitle && <p className="kanza-page-sub">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
