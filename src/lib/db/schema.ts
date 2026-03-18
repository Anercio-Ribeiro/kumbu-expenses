import {
  pgTable, text, integer, numeric, timestamp, boolean,
  uuid, pgEnum, index
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────
export const periodEnum = pgEnum('period', ['daily', 'weekly', 'monthly', 'yearly', 'once'])
export const expenseCategoryEnum = pgEnum('expense_category', [
  'food', 'transport', 'health', 'leisure', 'education',
  'housing', 'clothing', 'technology', 'children', 'savings', 'credit', 'other',
])
export const incomeCategoryEnum = pgEnum('income_category', [
  'salary', 'freelance', 'business', 'investment', 'rental', 'other',
])
export const goalStatusEnum = pgEnum('goal_status', ['active', 'completed', 'paused'])
export const creditStatusEnum = pgEnum('credit_status', ['active', 'paid', 'paused'])
export const debtStatusEnum = pgEnum('debt_status', ['pending', 'settled', 'overdue'])
export const loanStatusEnum = pgEnum('loan_status', ['pending', 'repaid', 'partial'])

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
  currency: text('currency').notNull().default('AOA'),
  locale: text('locale').notNull().default('pt-AO'),
  theme: text('theme').notNull().default('dark'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Income Sources ───────────────────────────────────────────────────────────
export const incomes = pgTable('incomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  category: incomeCategoryEnum('category').notNull().default('salary'),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  period: periodEnum('period').notNull().default('monthly'),
  receivedAt: timestamp('received_at').notNull(),
  notes: text('notes'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, t => ({ userIdx: index('income_user_idx').on(t.userId) }))

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'set null' }),
  creditId: uuid('credit_id').references(() => credits.id, { onDelete: 'set null' }),
  customCategoryId: uuid('custom_category_id').references(() => customCategories.id, { onDelete: 'set null' }),
  subcategoryId: uuid('subcategory_id').references(() => subcategories.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  category: expenseCategoryEnum('category').notNull().default('other'),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  spentAt: timestamp('spent_at').notNull(),
  notes: text('notes'),
  tags: text('tags').array(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, t => ({
  userIdx: index('expense_user_idx').on(t.userId),
  dateIdx: index('expense_date_idx').on(t.spentAt),
  catIdx: index('expense_cat_idx').on(t.category),
}))


// ─── Custom Categories ────────────────────────────────────────────────────────
/**
 * User-defined expense categories that extend the built-in enum.
 * Each user can create unlimited categories with name, icon, colour.
 * A category can be a top-level category (parentId=null) or a sub-category.
 * Built-in categories are seeded from DEFAULT_CATEGORIES constant; they are
 * stored per-user so they can be renamed/hidden without affecting others.
 */
export const customCategories = pgTable('custom_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('📦'),
  color: text('color').notNull().default('#8b91a8'),
  builtinKey: text('builtin_key'),   // mirrors expenseCategoryEnum key when seeded
  isBuiltin: boolean('is_builtin').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => ({ userIdx: index('custom_cat_user_idx').on(t.userId) }))

// ─── Subcategories ────────────────────────────────────────────────────────────
export const subcategories = pgTable('subcategories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => customCategories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('•'),
  color: text('color'),              // inherits from parent if null
  isBuiltin: boolean('is_builtin').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, t => ({ catIdx: index('subcat_cat_idx').on(t.categoryId) }))

// ─── Credits / Loans ──────────────────────────────────────────────────────────
export const credits = pgTable('credits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  entity: text('entity'),
  totalAmount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  monthlyPayment: numeric('monthly_payment', { precision: 15, scale: 2 }).notNull(),
  totalMonths: integer('total_months').notNull(),
  startDate: timestamp('start_date').notNull(),
  status: creditStatusEnum('status').notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, t => ({ userIdx: index('credit_user_idx').on(t.userId) }))


// ─── Debts (money user OWES) ──────────────────────────────────────────────────
export const debts = pgTable('debts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  creditor: text('creditor').notNull(),
  originalAmount: numeric('original_amount', { precision: 15, scale: 2 }).notNull(),
  remainingAmount: numeric('remaining_amount', { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp('due_date'),
  status: debtStatusEnum('status').notNull().default('pending'),
  settledAt: timestamp('settled_at'),
  settledExpenseId: uuid('settled_expense_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, t => ({ userIdx: index('debt_user_idx').on(t.userId) }))

// ─── Loans (money user LENT) ──────────────────────────────────────────────────
export const loans = pgTable('loans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  borrower: text('borrower').notNull(),
  originalAmount: numeric('original_amount', { precision: 15, scale: 2 }).notNull(),
  repaidAmount: numeric('repaid_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  dueDate: timestamp('due_date'),
  status: loanStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, t => ({ userIdx: index('loan_user_idx').on(t.userId) }))

// ─── Children ─────────────────────────────────────────────────────────────────
export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  birthDate: timestamp('birth_date').notNull(),
  avatar: text('avatar'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Financial Goals ──────────────────────────────────────────────────────────
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'set null' }),
  creditId: uuid('credit_id').references(() => credits.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  targetAmount: numeric('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: numeric('current_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  targetDate: timestamp('target_date').notNull(),
  icon: text('icon').notNull().default('🎯'),
  status: goalStatusEnum('status').notNull().default('active'),
  monthlySavingsTarget: numeric('monthly_savings_target', { precision: 15, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Goal Contributions ───────────────────────────────────────────────────────
export const goalContributions = pgTable('goal_contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').notNull().references(() => goals.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  notes: text('notes'),
  contributedAt: timestamp('contributed_at').notNull().defaultNow(),
})

// ─── Budget Rules ─────────────────────────────────────────────────────────────
export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: expenseCategoryEnum('category').notNull(),
  monthlyLimit: numeric('monthly_limit', { precision: 15, scale: 2 }).notNull(),
  year: integer('year').notNull(),
  month: integer('month').notNull(), // 1–12
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  incomes: many(incomes),
  expenses: many(expenses),
  children: many(children),
  goals: many(goals),
  sessions: many(sessions),
  budgets: many(budgets),
  credits: many(credits),
  debts: many(debts),
  loans: many(loans),
  customCategories: many(customCategories),
  subcategories: many(subcategories),
}))

export const incomesRelations = relations(incomes, ({ one }) => ({
  user: one(users, { fields: [incomes.userId], references: [users.id] }),
}))

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
  child: one(children, { fields: [expenses.childId], references: [children.id] }),
  credit: one(credits, { fields: [expenses.creditId], references: [credits.id] }),
  customCategory: one(customCategories, { fields: [expenses.customCategoryId], references: [customCategories.id] }),
  subcategory: one(subcategories, { fields: [expenses.subcategoryId], references: [subcategories.id] }),
}))



export const customCategoriesRelations = relations(customCategories, ({ one, many }) => ({
  user: one(users, { fields: [customCategories.userId], references: [users.id] }),
  subcategories: many(subcategories),
  expenses: many(expenses),
}))

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  user: one(users, { fields: [subcategories.userId], references: [users.id] }),
  category: one(customCategories, { fields: [subcategories.categoryId], references: [customCategories.id] }),
  expenses: many(expenses),
}))


export const debtsRelations = relations(debts, ({ one }) => ({
  user: one(users, { fields: [debts.userId], references: [users.id] }),
}))

export const loansRelations = relations(loans, ({ one }) => ({
  user: one(users, { fields: [loans.userId], references: [users.id] }),
}))

export const creditsRelations = relations(credits, ({ one, many }) => ({
  user: one(users, { fields: [credits.userId], references: [users.id] }),
  payments: many(expenses),
}))

export const childrenRelations = relations(children, ({ one, many }) => ({
  user: one(users, { fields: [children.userId], references: [users.id] }),
  expenses: many(expenses),
  goals: many(goals),
}))

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  child: one(children, { fields: [goals.childId], references: [children.id] }),
  contributions: many(goalContributions),
}))

export const goalContributionsRelations = relations(goalContributions, ({ one }) => ({
  goal: one(goals, { fields: [goalContributions.goalId], references: [goals.id] }),
  user: one(users, { fields: [goalContributions.userId], references: [users.id] }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Income = typeof incomes.$inferSelect
export type NewIncome = typeof incomes.$inferInsert
export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
export type Child = typeof children.$inferSelect
export type NewChild = typeof children.$inferInsert
export type Goal = typeof goals.$inferSelect
export type NewGoal = typeof goals.$inferInsert
export type GoalContribution = typeof goalContributions.$inferSelect
export type Budget = typeof budgets.$inferSelect
export type Debt = typeof debts.$inferSelect
export type NewDebt = typeof debts.$inferInsert
export type Loan = typeof loans.$inferSelect
export type NewLoan = typeof loans.$inferInsert
export type Credit = typeof credits.$inferSelect
export type NewCredit = typeof credits.$inferInsert
export type CustomCategory = typeof customCategories.$inferSelect
export type NewCustomCategory = typeof customCategories.$inferInsert
export type Subcategory = typeof subcategories.$inferSelect
export type NewSubcategory = typeof subcategories.$inferInsert
