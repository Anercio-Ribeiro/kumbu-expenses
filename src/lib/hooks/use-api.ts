'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { IncomeInput, ExpenseInput, ChildInput, GoalInput, ContributionInput } from '@/lib/validators'

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const qk = {
  dashboard: (y: number, m: number) => ['dashboard', y, m] as const,
  cashFlow: () => ['cashFlow'] as const,
  incomes: () => ['incomes'] as const,
  expenses: (filters?: object) => ['expenses', filters] as const,
  expensesByCategory: (y: number, m: number) => ['expensesByCategory', y, m] as const,
  children: () => ['children'] as const,
  child: (id: string) => ['child', id] as const,
  goals: () => ['goals'] as const,
  stats: () => ['stats'] as const,
  budgets: (y: number, m: number) => ['budgets', y, m] as const,
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro na requisição')
  return data
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function useDashboard(year: number, month: number) {
  return useQuery({
    queryKey: qk.dashboard(year, month),
    queryFn: () => fetchApi(`/api/stats/dashboard?year=${year}&month=${month}`),
  })
}

export function useCashFlow() {
  return useQuery({
    queryKey: qk.cashFlow(),
    queryFn: () => fetchApi('/api/stats/cashflow'),
  })
}

// ─── Incomes ──────────────────────────────────────────────────────────────────
export function useIncomes() {
  return useQuery({
    queryKey: qk.incomes(),
    queryFn: () => fetchApi<{ incomes: any[] }>('/api/income'),
  })
}

export function useCreateIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: IncomeInput) =>
      fetchApi('/api/income', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.incomes() })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: qk.cashFlow() })
      toast.success('Renda adicionada com sucesso!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/income/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.incomes() })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Renda removida')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export function useExpenses(filters?: { category?: string; childId?: string; year?: number; month?: number }) {
  return useQuery({
    queryKey: qk.expenses(filters),
    queryFn: () => {
      const p = new URLSearchParams()
      if (filters?.category) p.set('category', filters.category)
      if (filters?.childId) p.set('childId', filters.childId)
      if (filters?.year) p.set('year', String(filters.year))
      if (filters?.month) p.set('month', String(filters.month))
      return fetchApi<{ expenses: any[] }>(`/api/expenses?${p}`)
    },
  })
}

export function useExpensesByCategory(year: number, month: number) {
  return useQuery({
    queryKey: qk.expensesByCategory(year, month),
    queryFn: () => fetchApi(`/api/expenses/by-category?year=${year}&month=${month}`),
  })
}

export function useCreateExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ExpenseInput) =>
      fetchApi('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['expensesByCategory'] })
      qc.invalidateQueries({ queryKey: qk.cashFlow() })
      toast.success('Despesa registada com sucesso!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/expenses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Despesa removida')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Children ─────────────────────────────────────────────────────────────────
export function useChildren() {
  return useQuery({
    queryKey: qk.children(),
    queryFn: () => fetchApi<{ children: any[] }>('/api/children'),
  })
}

export function useChild(id: string) {
  return useQuery({
    queryKey: qk.child(id),
    queryFn: () => fetchApi(`/api/children/${id}`),
    enabled: !!id,
  })
}

export function useCreateChild() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ChildInput) =>
      fetchApi('/api/children', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.children() })
      toast.success('Filho/a adicionado com sucesso!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export function useGoals() {
  return useQuery({
    queryKey: qk.goals(),
    queryFn: () => fetchApi<{ goals: any[] }>('/api/goals'),
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GoalInput) =>
      fetchApi('/api/goals', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.goals() })
      toast.success('Objectivo criado!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddContribution() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: ContributionInput }) =>
      fetchApi(`/api/goals/${goalId}/contribute`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.goals() })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Contribuição registada!')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Statistics ───────────────────────────────────────────────────────────────
export function useStats() {
  return useQuery({
    queryKey: qk.stats(),
    queryFn: () => fetchApi('/api/stats'),
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Categories & Subcategories ───────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchApi<{ categories: any[] }>('/api/categories'),
    staleTime: 5 * 60 * 1000, // categories change rarely
  })
}

export function useCreateCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; icon: string; color: string }) =>
      fetchApi('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Categoria criada!') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateSubcategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: { name: string; icon: string; color?: string } }) =>
      fetchApi(`/api/categories/${categoryId}`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Sub-categoria criada!') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      fetchApi(`/api/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Categoria actualizada!') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useArchiveCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/api/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Categoria arquivada') },
    onError: (e: Error) => toast.error(e.message),
  })
}
