import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type ExpenseCategory, type IncomeCategory } from '@/lib/utils/finance'
import { cn } from '@/lib/utils'

export function ExpenseCategoryBadge({ category, showIcon = true }: { category: string; showIcon?: boolean }) {
  const meta = EXPENSE_CATEGORIES[category as ExpenseCategory] ?? EXPENSE_CATEGORIES.other
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: meta.color + '20', color: meta.color }}
    >
      {showIcon && <span>{meta.icon}</span>}
      {meta.label}
    </span>
  )
}

export function IncomeCategoryBadge({ category }: { category: string }) {
  const meta = INCOME_CATEGORIES[category as IncomeCategory] ?? INCOME_CATEGORIES.other
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: meta.color + '20', color: meta.color }}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  )
}
