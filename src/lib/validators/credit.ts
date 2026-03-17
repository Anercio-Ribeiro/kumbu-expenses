import { z } from 'zod'

export const creditSchema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  entity: z.string().optional(),
  totalAmount: z.coerce.number().positive('Valor do crédito deve ser positivo'),
  monthlyPayment: z.coerce.number().positive('Mensalidade deve ser positiva'),
  totalMonths: z.coerce.number().int().min(1, 'Duração mínima de 1 mês'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  notes: z.string().optional(),
})

export const amortizeSchema = z.object({
  amount: z.coerce.number().positive('Valor de amortização deve ser positivo'),
  date: z.string().min(1, 'Data obrigatória'),
  notes: z.string().optional(),
})

export type CreditInput = z.infer<typeof creditSchema>
export type AmortizeInput = z.infer<typeof amortizeSchema>
