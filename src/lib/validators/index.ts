import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As palavras-passe não coincidem',
  path: ['confirmPassword'],
})

export const incomeSchema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  category: z.enum(['salary', 'freelance', 'business', 'investment', 'rental', 'other']),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'once']),
  receivedAt: z.string().min(1, 'Data obrigatória'),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
})

export const expenseSchema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  category: z.enum(['food', 'transport', 'health', 'leisure', 'education', 'housing', 'clothing', 'technology', 'children', 'savings', 'other']),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  spentAt: z.string().min(1, 'Data obrigatória'),
  notes: z.string().optional(),
  childId: z.string().uuid().optional().nullable(),
  isRecurring: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
})

export const childSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  birthDate: z.string().min(1, 'Data de nascimento obrigatória'),
  notes: z.string().optional(),
})

export const goalSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  targetAmount: z.coerce.number().positive('Valor alvo deve ser positivo'),
  currentAmount: z.coerce.number().min(0).default(0),
  targetDate: z.string().min(1, 'Prazo obrigatório'),
  icon: z.string().default('🎯'),
  childId: z.string().uuid().optional().nullable(),
  monthlySavingsTarget: z.coerce.number().min(0).optional(),
})

export const contributionSchema = z.object({
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  notes: z.string().optional(),
})

export const budgetSchema = z.object({
  category: z.enum(['food', 'transport', 'health', 'leisure', 'education', 'housing', 'clothing', 'technology', 'children', 'savings', 'other']),
  monthlyLimit: z.coerce.number().positive(),
  year: z.coerce.number(),
  month: z.coerce.number().min(1).max(12),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type IncomeInput = z.infer<typeof incomeSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>
export type ChildInput = z.infer<typeof childSchema>
export type GoalInput = z.infer<typeof goalSchema>
export type ContributionInput = z.infer<typeof contributionSchema>

export { creditSchema, amortizeSchema } from './credit'
export type { CreditInput, AmortizeInput } from './credit'
