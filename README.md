# Kanza — Gestão Financeira Pessoal

Aplicação de gestão financeira pessoal em **Kwanza angolano (AOA)**, construída com Next.js 15, TypeScript, Drizzle ORM e Neon PostgreSQL.

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript (strict) |
| Base de Dados | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Autenticação | NextAuth v5 (JWT) |
| Estado Servidor | React Query (TanStack) |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts (com tooltips hover) |
| Estilo | Tailwind CSS + variáveis CSS |
| Temas | next-themes (dark/light/system) |
| Notificações | Sonner |
| Animações | Framer Motion |

## Funcionalidades

- 🔐 **Autenticação** — Registo, login, sessão JWT, middleware de protecção de rotas
- 📊 **Dashboard** — Métricas em tempo real, gráficos interactivos, regra 50/30/20
- 💰 **Rendas** — Registo com categoria, periodicidade, notas
- 💸 **Despesas** — Filtros, categorias, associação a filhos, pesquisa
- 📁 **Categorias** — Análise visual com donut chart e barras horizontais
- 📈 **Estatísticas** — Média, mediana, desvio padrão, coeficiente de variação, tendência 6 meses
- 💎 **Poupanças** — Taxa actual, simulador interactivo, regra 50/30/20
- 🎯 **Objectivos** — Rings de progresso, projecções, contribuições, tracking carro 18M Kz
- 🧒 **Filhos** — Gestão de gastos por filho, planeamento financeiro para o futuro
- 💡 **Dicas** — Conselhos personalizados baseados nos dados reais
- ☀️🌙 **Dark/Light Mode** — Tema completo, persistido

## Estrutura do Projecto

```
src/
├── app/
│   ├── (auth)/           # Login, Registo
│   ├── (dashboard)/      # Páginas protegidas
│   │   ├── dashboard/    # Server + Client components
│   │   ├── income/
│   │   ├── expenses/
│   │   ├── categories/
│   │   ├── statistics/
│   │   ├── savings/
│   │   ├── goals/
│   │   ├── children/
│   │   ├── tips/
│   │   └── settings/
│   └── api/              # Route handlers
│       ├── auth/
│       ├── income/
│       ├── expenses/
│       ├── children/
│       ├── goals/
│       └── stats/
├── components/
│   ├── ui/               # MetricCard, Dialog, Badges, Skeletons
│   ├── charts/           # Recharts wrappers com tooltips
│   ├── goals/            # GoalRing SVG
│   └── layout/           # Sidebar (server + client)
├── lib/
│   ├── db/               # Schema, queries, Neon connection
│   ├── auth/             # NextAuth config, session helpers
│   ├── validators/       # Zod schemas
│   ├── utils/            # finance.ts (cálculos), index.ts
│   └── hooks/            # React Query hooks (use-api.ts)
├── store/                # QueryProvider
├── styles/               # globals.css (CSS variables dark/light)
└── types/                # next-auth.d.ts
```

## Instalação

### 1. Clonar e instalar dependências

```bash
git clone <repo>
cd kanza-finance
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edita `.env.local`:
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/kanza?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Criar base de dados no Neon

1. Vai a [neon.tech](https://neon.tech) e cria um projecto
2. Copia a connection string para `DATABASE_URL`
3. Executa as migrações:

```bash
npm run db:push
```

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) e cria a tua conta.

## Padrão Server/Client Components

Cada página segue este padrão:

```
page.tsx (Server Component)
  ↓ busca dados com Drizzle ORM directamente
  ↓ passa como props para:
page-client.tsx (Client Component — 'use client')
  ↓ usa React Query para mutações
  ↓ estado local com useState/useMemo
  ↓ formulários com react-hook-form + zod
```

## Cálculos Financeiros (src/lib/utils/finance.ts)

Todos os cálculos são precisos e auditáveis:

- **`formatKz(n)`** — Formata em Kwanza com locale pt-AO
- **`calcSavingsRate(income, expenses)`** — Taxa de poupança exacta com 2 casas decimais
- **`calcGoalProjection(...)`** — Projecção de objectivo com data prevista, meses necessários, estado no prazo
- **`simulateSavings(income, pct)`** — Simulação de poupança para 1/3/5/10 anos
- **`calc503020(income)`** — Regra 50/30/20
- **`calcDescriptiveStats(values)`** — Média, mediana, desvio padrão, variância, IQR, CV

## Comandos Úteis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run db:push      # Sincronizar schema com Neon
npm run db:studio    # Drizzle Studio (GUI da BD)
npm run db:migrate   # Gerar e aplicar migrações
```
