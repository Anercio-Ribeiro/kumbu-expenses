import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/session'
import { getDashboardStats } from '@/lib/db/queries'
import { getTopCategories } from '@/lib/db/category-queries'
import { getDebtSummary, getLoanSummary } from '@/lib/db/debt-loan-queries'
import { formatKz, calcSavingsRate } from '@/lib/utils/finance'
import { classifyIncome, getBudgetSuggestion, calcFinancialHealth } from '@/lib/utils/financial-health'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Dicas' }

export default async function TipsPage() {
  const user = await getCurrentUser()
  const now = new Date()
  const [stats, topCats, debtSummary, loanSummary] = await Promise.all([
    getDashboardStats(user.id, now.getFullYear(), now.getMonth() + 1),
    getTopCategories(user.id, now.getFullYear(), now.getMonth() + 1),
    getDebtSummary(user.id),
    getLoanSummary(user.id),
  ])

  const topCat = topCats[0]
  const savingsRate = calcSavingsRate(stats.totalIncome, stats.totalExpenses)
  const incomeLevel = classifyIncome(stats.totalIncome)
  const suggestion = getBudgetSuggestion(stats.totalIncome)
  const health = calcFinancialHealth(
    stats.totalIncome, stats.totalExpenses,
    debtSummary.totalPending, 0, loanSummary.totalPending,
  )

  const carGoal = 18_000_000
  const monthsForCar = stats.balance > 0 ? Math.ceil(carGoal / stats.balance) : 9999

  // Income-level context for personalised advice
  const isLowIncome = incomeLevel === 'very_low' || incomeLevel === 'low'
  const isHighIncome = incomeLevel === 'upper_middle' || incomeLevel === 'high'

  type Tip = { icon: string; tag: string; tagColor: string; title: string; body: string; priority?: number }

  const tips: Tip[] = ([
    // Health alert tip — shown first if issues exist
    health.alerts.length > 0 ? {
      icon: '🚨',
      tag: 'Atenção',
      tagColor: 'bg-expense/10 text-expense',
      title: 'A tua saúde financeira precisa de atenção',
      body: health.alerts[0] + (health.alerts.length > 1 ? ` Adicionalmente: ${health.alerts[1]}` : '') + ` O teu score actual é ${health.score}/100 (${health.label}).`,
      priority: 0,
    } : null,

    // Budget rule — adapted to income level
    {
      icon: '💡',
      tag: isLowIncome ? 'Prioridade' : 'Regra Essencial',
      tagColor: 'bg-primary/10 text-primary',
      title: isLowIncome
        ? 'Foca-te em cobrir o essencial primeiro'
        : `A regra ${suggestion.needs}/${suggestion.wants}/${suggestion.savings} para o teu rendimento`,
      body: isLowIncome
        ? `Com a tua renda actual, a prioridade é garantir as necessidades básicas (${formatKz(Math.round(stats.totalIncome * suggestion.needs / 100))}). Mesmo poupar ${formatKz(Math.round(stats.totalIncome * suggestion.savings / 100))} por mês faz diferença a longo prazo.`
        : `Distribui: ${formatKz(Math.round(stats.totalIncome * suggestion.needs / 100))} para necessidades, ${formatKz(suggestion.leisureBudget)} para lazer e ${formatKz(suggestion.savingsBudget)} para poupança mínima. Isto é adaptado ao teu nível de renda.`,
      priority: 1,
    },

    // Debt tip — only if there are debts
    debtSummary.totalPending > 0 ? {
      icon: '⚠️',
      tag: 'Dívidas',
      tagColor: 'bg-expense/10 text-expense',
      title: 'Estratégia para quitar as tuas dívidas',
      body: `Tens ${formatKz(debtSummary.totalPending)} em dívidas pendentes${debtSummary.overdueCount > 0 ? `, ${debtSummary.overdueCount} em atraso` : ''}. ${isLowIncome ? 'Prioriza quitar a mais pequena primeiro (método bola de neve) para ganhar confiança.' : 'Considera usar um bónus ou poupança extra para quitar primeiro as dívidas com mais encargos.'} Ao quitares, a despesa é registada automaticamente no Kanza.`,
      priority: 2,
    } : null,

    // Loans tip — only if there are outstanding loans
    loanSummary.totalPending > 0 ? {
      icon: '🤝',
      tag: 'Empréstimos',
      tagColor: 'bg-blue-500/10 text-blue-500',
      title: `Tens ${formatKz(loanSummary.totalPending)} por receber`,
      body: `Este valor está fora do teu alcance imediato mas conta como activo. Quando te for devolvido, será adicionado automaticamente como renda. Tenta estabelecer um prazo claro com o devedor para planear os teus fluxos de caixa com mais precisão.`,
      priority: 3,
    } : null,

    // Top spending category tip
    topCat ? {
      icon: topCat.icon,
      tag: 'Maior Gasto',
      tagColor: 'bg-expense/10 text-expense',
      title: `Optimiza os gastos em ${topCat.name}`,
      body: isLowIncome
        ? `Esta categoria representa ${formatKz(topCat.total)} este mês. Analisa item a item o que podes reduzir sem impactar muito a qualidade de vida — pequenas reduções acumulam muito.`
        : `Esta categoria representa ${formatKz(topCat.total)} este mês. Estabelece um limite mensal e usa sub-categorias no Kanza para identificar exactamente onde está o excesso.`,
      priority: 4,
    } : null,

    // Car goal tip
    {
      icon: '🚗',
      tag: 'Objectivo Carro',
      tagColor: 'bg-income/10 text-income',
      title: 'Plano para o carro de 18.000.000 Kz',
      body: isHighIncome
        ? `Ao ritmo actual (${formatKz(Math.max(stats.balance, 0))}/mês), precisarás de ${monthsForCar >= 9999 ? 'rever o plano' : `${monthsForCar} meses`}. Com o teu nível de renda, considera também um crédito automóvel parcial para não imobilizar o capital.`
        : `Ao ritmo actual, precisarás de ${monthsForCar >= 9999 ? 'aumentar a poupança primeiro' : `${monthsForCar} meses (${(monthsForCar / 12).toFixed(1)} anos)`}. Poupar ${formatKz(suggestion.savingsBudget)} por mês chega a ${formatKz(suggestion.savingsBudget * 60)} em 5 anos.`,
      priority: 5,
    },

    // Emergency fund
    {
      icon: '🛡️',
      tag: 'Fundo Emergência',
      tagColor: 'bg-blue-500/10 text-blue-500',
      title: 'O teu escudo contra imprevistos',
      body: `Guarda ${suggestion.emergency} meses de despesas em poupança de fácil acesso — entre ${formatKz(stats.totalExpenses * suggestion.emergency / 2)} e ${formatKz(stats.totalExpenses * suggestion.emergency)}. ${isLowIncome ? 'Mesmo começar com 50.000 Kz já cria um amortecedor importante.' : 'Com este fundo, não precisas de recorrer a crédito quando surgem imprevistos.'}`,
      priority: 6,
    },

    // Subcategories tip
    {
      icon: '⊞',
      tag: 'Sub-categorias',
      tagColor: 'bg-amber-500/10 text-amber-500',
      title: 'Usa sub-categorias para radiografar os gastos',
      body: `Em vez de "Transporte" genérico, regista "Combustível", "Manutenção" ou "Táxi". Assim identificas exatamente o que cortar. Por exemplo, talvez reduzir lavagens de carro liberte ${formatKz(Math.round(stats.totalIncome * 0.01))} por mês sem sacrifício real.`,
      priority: 7,
    },

    // Income-level specific tip
    isHighIncome ? {
      icon: '📈',
      tag: 'Investimento',
      tagColor: 'bg-green-500/10 text-green-500',
      title: 'Diversifica além da poupança tradicional',
      body: `Com o teu nível de renda, a poupança simples perde valor para a inflação. Considera depositos a prazo em bancos angolanos, títulos do tesouro AOA, ou investimento em negócios locais. A regra: mínimo ${suggestion.savings}% poupado antes de qualquer investimento.`,
      priority: 8,
    } : isLowIncome ? {
      icon: '📚',
      tag: 'Crescimento',
      tagColor: 'bg-green-500/10 text-green-500',
      title: 'Investe no aumento da tua renda',
      body: `A forma mais eficaz de melhorar a saúde financeira com renda baixa é aumentá-la. Competências digitais, formação profissional ou trabalho freelance podem representar um aumento real de renda em 6-12 meses. Mesmo que pequeno, cada Kwanza extra ajuda.`,
      priority: 8,
    } : {
      icon: '🔄',
      tag: 'Automatização',
      tagColor: 'bg-purple-500/10 text-purple-500',
      title: 'Automatiza a poupança no dia do pagamento',
      body: `Transfere ${formatKz(suggestion.savingsBudget)} automaticamente no dia em que recebes. "Poupa primeiro, gasta o que sobra." Este hábito pode aumentar a poupança real em até 40% em comparação com poupar o que sobra no fim do mês.`,
      priority: 8,
    },
  ] as (Tip | null)[]).filter((t): t is Tip => t !== null).sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9))

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Dicas de Poupança"
        subtitle="Conselhos personalizados baseados nos teus dados financeiros reais"
      />

      {/* Health banner */}
      <div className={`kanza-card p-5 flex items-center gap-4 border-2`} style={{ borderColor: health.color + '50', background: health.color + '08' }}>
        <div className="text-3xl">
          {health.level === 'excellent' ? '🎉' : health.level === 'good' ? '💪' : health.level === 'fair' ? '📊' : health.level === 'poor' ? '⚠️' : '🚨'}
        </div>
        <div className="flex-1">
          <p className="font-semibold">
            Saúde financeira: <span style={{ color: health.color }}>{health.label}</span>
            <span className="text-sm text-muted-foreground ml-2">({health.score}/100)</span>
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Taxa de poupança: <strong>{savingsRate.toFixed(1)}%</strong>
            {' · '}
            Meta sugerida: <strong>{suggestion.savings}%</strong>
            {savingsRate < suggestion.savings && ` · Faltam ${formatKz(Math.round((suggestion.savings - savingsRate) * stats.totalIncome / 100))} por mês`}
          </p>
        </div>
      </div>

      {/* Tips grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tips.map((tip, i) => (
          <div key={i} className={`kanza-card p-6 flex gap-4 hover:scale-[1.01] transition-transform ${i === 0 && tips[0].tag === 'Atenção' ? 'md:col-span-2 border-expense/30' : i === 1 && tips[0].tag !== 'Atenção' ? 'md:col-span-2' : ''}`}>
            <div className="text-3xl flex-shrink-0">{tip.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${tip.tagColor}`}>{tip.tag}</span>
              </div>
              <h3 className="font-bold text-base mb-2">{tip.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{tip.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
