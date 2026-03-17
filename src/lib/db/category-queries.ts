import { db } from './index'
import { customCategories, subcategories, expenses } from './schema'
import { eq, and, asc, sum, count, gte, lte } from 'drizzle-orm'
import { startOfMonth, endOfMonth } from 'date-fns'
import { DEFAULT_CATEGORIES } from '@/lib/utils/category-defaults'

export async function seedDefaultCategories(userId: string) {
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const def = DEFAULT_CATEGORIES[i]
    const [cat] = await db.insert(customCategories).values({
      userId, name: def.name, icon: def.icon, color: def.color,
      builtinKey: def.builtinKey, isBuiltin: true, sortOrder: i,
    }).returning()
    if (def.subcategories.length > 0) {
      await db.insert(subcategories).values(
        def.subcategories.map((s, j) => ({
          userId, categoryId: cat.id, name: s.name, icon: s.icon, isBuiltin: true, sortOrder: j,
        }))
      )
    }
  }
}

export async function ensureCategories(userId: string) {
  const existing = await db.select({ id: customCategories.id })
    .from(customCategories).where(eq(customCategories.userId, userId)).limit(1)
  if (existing.length === 0) await seedDefaultCategories(userId)
}

export async function getCategoriesWithSubs(userId: string) {
  await ensureCategories(userId)
  return db.query.customCategories.findMany({
    where: and(eq(customCategories.userId, userId), eq(customCategories.isArchived, false)),
    with: {
      subcategories: {
        where: eq(subcategories.isArchived, false),
        orderBy: [asc(subcategories.sortOrder), asc(subcategories.name)],
      },
    },
    orderBy: [asc(customCategories.sortOrder), asc(customCategories.name)],
  })
}

export async function getCategoriesWithTotals(userId: string, year: number, month: number) {
  await ensureCategories(userId)
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(new Date(year, month - 1))
  const cats = await getCategoriesWithSubs(userId)

  const catTotals = await db
    .select({ catId: expenses.customCategoryId, total: sum(expenses.amount), txCount: count() })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), gte(expenses.spentAt, start), lte(expenses.spentAt, end)))
    .groupBy(expenses.customCategoryId)

  const subTotals = await db
    .select({ subId: expenses.subcategoryId, total: sum(expenses.amount), txCount: count() })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), gte(expenses.spentAt, start), lte(expenses.spentAt, end)))
    .groupBy(expenses.subcategoryId)

  return cats.map(cat => ({
    ...cat,
    total: Number(catTotals.find(t => t.catId === cat.id)?.total ?? 0),
    txCount: Number(catTotals.find(t => t.catId === cat.id)?.txCount ?? 0),
    subcategories: cat.subcategories.map(sub => ({
      ...sub,
      total: Number(subTotals.find(t => t.subId === sub.id)?.total ?? 0),
      txCount: Number(subTotals.find(t => t.subId === sub.id)?.txCount ?? 0),
    })),
  }))
}

export async function getTopCategories(userId: string, year: number, month: number) {
  await ensureCategories(userId)
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(new Date(year, month - 1))

  const rows = await db
    .select({ catId: expenses.customCategoryId, total: sum(expenses.amount), txCount: count() })
    .from(expenses)
    .where(and(eq(expenses.userId, userId), gte(expenses.spentAt, start), lte(expenses.spentAt, end)))
    .groupBy(expenses.customCategoryId)

  const cats = await getCategoriesWithSubs(userId)
  const catMap = Object.fromEntries(cats.map(c => [c.id, c]))

  return rows
    .filter(r => r.catId && Number(r.total) > 0)
    .map(r => ({
      categoryId: r.catId!,
      name: catMap[r.catId!]?.name ?? 'Outros',
      icon: catMap[r.catId!]?.icon ?? 'U+1F4E6',
      color: catMap[r.catId!]?.color ?? '#8b91a8',
      total: Number(r.total ?? 0),
      txCount: Number(r.txCount),
    }))
    .sort((a, b) => b.total - a.total)
}

export async function createCategory(userId: string, data: { name: string; icon: string; color: string }) {
  const existing = await db.select({ id: customCategories.id }).from(customCategories).where(eq(customCategories.userId, userId))
  const [cat] = await db.insert(customCategories).values({
    userId, ...data, isBuiltin: false, sortOrder: existing.length,
  }).returning()
  return cat
}

export async function createSubcategory(userId: string, categoryId: string, data: { name: string; icon: string; color?: string }) {
  const cat = await db.query.customCategories.findFirst({
    where: and(eq(customCategories.id, categoryId), eq(customCategories.userId, userId)),
  })
  if (!cat) throw new Error('Categoria não encontrada')
  const existing = await db.select({ id: subcategories.id }).from(subcategories).where(eq(subcategories.categoryId, categoryId))
  const [sub] = await db.insert(subcategories).values({
    userId, categoryId, ...data, isBuiltin: false, sortOrder: existing.length,
  }).returning()
  return sub
}

export async function updateCategory(userId: string, id: string, data: Partial<{ name: string; icon: string; color: string; isArchived: boolean }>) {
  const [updated] = await db.update(customCategories).set(data)
    .where(and(eq(customCategories.id, id), eq(customCategories.userId, userId))).returning()
  return updated
}

export async function updateSubcategory(userId: string, id: string, data: Partial<{ name: string; icon: string; color: string; isArchived: boolean }>) {
  const [updated] = await db.update(subcategories).set(data)
    .where(and(eq(subcategories.id, id), eq(subcategories.userId, userId))).returning()
  return updated
}

export async function archiveCategory(userId: string, id: string) {
  return updateCategory(userId, id, { isArchived: true })
}

export async function archiveSubcategory(userId: string, id: string) {
  return updateSubcategory(userId, id, { isArchived: true })
}
