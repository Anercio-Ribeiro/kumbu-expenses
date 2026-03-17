import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/session'
import { getDashboardStats } from '@/lib/db/queries'
import { getTopCategories } from '@/lib/db/category-queries'
import { formatKz, calc503020, calcSavingsRate } from '@/lib/utils/finance'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = { title: 'Dicas' }

export default async function TipsPage() {
  const user = await getCurrentUser()
  const now = new Date()
  const [stats, topCats] = await Promise.all([
    getDashboardStats(user.id, now.getFullYear(), now.getMonth() + 1),
    getTopCategories(user.id, now.getFullYear(), now.getMonth() + 1),
  ])

  const topCat = topCats[0]
  const rule = calc503020(stats.totalIncome)
  const savingsRate = calcSavingsRate(stats.totalIncome, stats.totalExpenses)
  const carGoal = 18_000_000
  const monthsForCar = stats.balance > 0 ? Math.ceil(carGoal / stats.balance) : 9999

  const tips = [
    {
      icon: '💡',
      tag: 'Regra Essencial',
      tagColor: 'bg-primary/10 text-primary',
      title: 'A Regra 50/30/20 do teu rendimento',
      body: `Com a tua renda actual, distribui assim: ${formatKz(rule.needs)} para necessidades (casa, comida, saúde), ${formatKz(rule.wants)} para desejos pessoais e ${formatKz(rule.savings)} para poupança e investimento. Esta é a fórmula mais comprovada para equilíbrio financeiro.`,
    },
    {
      icon: '🚗',
      tag: 'Objectivo Carro',
      tagColor: 'bg-income/10 text-income',
      title: 'Plano para o carro de 18.000.000 Kz',
      body: `Ao ritmo actual de poupança (${formatKz(Math.max(stats.balance, 0))}/mês), precisarás de ${monthsForCar >= 9999 ? 'rever o plano' : `${monthsForCar} meses (${(monthsForCar / 12).toFixed(1)} anos)`}. Aumentar a poupança para 30% reduziria este tempo em cerca de 35%.`,
    },
    topCat ? {
      icon: topCat.icon,
      tag: 'Maior Gasto',
      tagColor: 'bg-expense/10 text-expense',
      title: `Optimiza os gastos em ${topCat.name}`,
      body: `Esta categoria representa ${formatKz(topCat.total)} dos teus gastos este mês. Estratégias práticas: planeia as despesas com antecedência, compara preços entre fornecedores, e estabelece um limite mensal fixo para esta categoria.`,
    } : null,
    {
      icon: '🏦',
      tag: 'Fundo de Emergência',
      tagColor: 'bg-blue-500/10 text-blue-500',
      title: 'Constrói o teu escudo financeiro',
      body: `Um fundo de emergência de 3 a 6 meses de despesas (${formatKz(stats.totalExpenses * 3)} a ${formatKz(stats.totalExpenses * 6)}) protege-te de imprevistos sem comprometer os teus objectivos de longo prazo. É a base de qualquer plano financeiro sólido.`,
    },
    {
      icon: '🔄',
      tag: 'Automatização',
      tagColor: 'bg-purple-500/10 text-purple-500',
      title: 'Poupa automaticamente no dia do pagamento',
      body: `Transfere ${formatKz(stats.totalIncome * 0.2)} automaticamente para uma conta poupança no dia em que receberes o salário. "Poupa primeiro, gasta o que sobra" — este princípio pode aumentar a taxa de poupança em até 40%.`,
    },
    {
      icon: '⊞',
      tag: 'Sub-categorias',
      tagColor: 'bg-amber-500/10 text-amber-500',
      title: 'Usa sub-categorias para detalhar os gastos',
      body: `Ao invés de apenas "Transporte", regista "Combustível", "Manutenção" ou "Lavagem" separadamente. Isso revela exatamente onde o dinheiro vai, facilitando cortar gastos específicos sem sacrificar toda a categoria.`,
    },
    {
      icon: '🛒',
      tag: 'Anti-impulso',
      tagColor: 'bg-amber-500/10 text-amber-500',
      title: 'Regra das 48h para compras não planeadas',
      body: `Para qualquer compra acima de ${formatKz(stats.totalIncome * 0.03)}, espera 48 horas antes de decidir. Este hábito elimina compras por impulso e pode reduzir gastos em lazer e compras não essenciais em até 20% ao mês.`,
    },
    {
      icon: '📈',
      tag: 'Crescimento',
      tagColor: 'bg-green-500/10 text-green-500',
      title: 'Investe no teu desenvolvimento profissional',
      body: `Cada Kwanza investido em formação e competências multiplica-se na carreira. Com ${savingsRate.toFixed(0)}% de taxa de poupança actual, ${savingsRate >= 20 ? 'podes alocar parte para investimento em educação' : 'atingir 20% de poupança primeiro é a prioridade'}.`,
    },
  ].filter(Boolean) as NonNullable<typeof tips[0]>[]

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Dicas de Poupança"
        subtitle="Conselhos personalizados baseados nos teus dados financeiros reais"
      />

      <div className={`kanza-card p-5 flex items-center gap-4 ${savingsRate >= 20 ? 'border-income/40 bg-income/5' : savingsRate >= 10 ? 'border-primary/40 bg-primary/5' : 'border-expense/40 bg-expense/5'}`}>
        <div className="text-3xl">{savingsRate >= 20 ? '🎉' : savingsRate >= 10 ? '💪' : '🚨'}</div>
        <div className="flex-1">
          <p className="font-semibold">{savingsRate >= 20 ? 'Excelente taxa de poupança!' : savingsRate >= 10 ? 'Estás a progredir — continua!' : 'Atenção: taxa de poupança baixa'}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Taxa actual: <strong>{savingsRate.toFixed(1)}%</strong>
            {savingsRate < 20 && ` · Meta: 20% (faltam ${formatKz(stats.totalIncome * 0.2 - Math.max(stats.balance, 0))} por mês)`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tips.map((tip, i) => (
          <div key={i} className={`kanza-card p-6 flex gap-4 hover:scale-[1.01] transition-transform ${i === 0 ? 'md:col-span-2' : ''}`}>
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
