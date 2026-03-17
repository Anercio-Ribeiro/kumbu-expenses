/**
 * Default categories seeded for every new user.
 * Each category has a set of default sub-categories.
 * Users can rename, add, archive, or reorder any of these.
 */
export interface DefaultSubcategory {
  name: string
  icon: string
}

export interface DefaultCategory {
  name: string
  icon: string
  color: string
  builtinKey: string
  subcategories: DefaultSubcategory[]
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    name: 'Alimentação',
    icon: '🍽️',
    color: '#f26060',
    builtinKey: 'food',
    subcategories: [
      { name: 'Supermercado', icon: '🛒' },
      { name: 'Restaurante', icon: '🍴' },
      { name: 'Take-away / Entrega', icon: '🥡' },
      { name: 'Café / Snacks', icon: '☕' },
      { name: 'Padaria / Mercearia', icon: '🥖' },
      { name: 'Bebidas', icon: '🥤' },
    ],
  },
  {
    name: 'Transporte',
    icon: '🚗',
    color: '#5b8ff9',
    builtinKey: 'transport',
    subcategories: [
      { name: 'Combustível', icon: '⛽' },
      { name: 'Manutenção / Revisão', icon: '🔧' },
      { name: 'Lavagem do Carro', icon: '🚿' },
      { name: 'Seguro Automóvel', icon: '📋' },
      { name: 'Táxi / Uber', icon: '🚕' },
      { name: 'Transporte Público', icon: '🚌' },
      { name: 'Estacionamento', icon: '🅿️' },
      { name: 'Pneus / Peças', icon: '🔩' },
    ],
  },
  {
    name: 'Casa',
    icon: '🏠',
    color: '#e8b84b',
    builtinKey: 'housing',
    subcategories: [
      { name: 'Renda / Prestação', icon: '🏘️' },
      { name: 'Energia Eléctrica', icon: '💡' },
      { name: 'Água', icon: '💧' },
      { name: 'Internet / TV / Cabo', icon: '📡' },
      { name: 'Condomínio', icon: '🏢' },
      { name: 'Manutenção / Reparação', icon: '🔨' },
      { name: 'Ar Condicionado', icon: '❄️' },
      { name: 'Mobiliário / Decoração', icon: '🛋️' },
      { name: 'Electrodomésticos', icon: '🔌' },
      { name: 'Limpeza / Higiene Casa', icon: '🧹' },
      { name: 'Empregada Doméstica', icon: '🧽' },
    ],
  },
  {
    name: 'Saúde',
    icon: '💊',
    color: '#3ecf8e',
    builtinKey: 'health',
    subcategories: [
      { name: 'Consulta Médica', icon: '👨‍⚕️' },
      { name: 'Farmácia / Medicamentos', icon: '💉' },
      { name: 'Dentista', icon: '🦷' },
      { name: 'Exames / Análises', icon: '🔬' },
      { name: 'Seguro de Saúde', icon: '🏥' },
      { name: 'Ginásio / Desporto', icon: '🏋️' },
      { name: 'Óptica', icon: '👓' },
      { name: 'Psicólogo', icon: '🧠' },
    ],
  },
  {
    name: 'Filhos',
    icon: '👶',
    color: '#ff9f43',
    builtinKey: 'children',
    subcategories: [
      { name: 'Escola / Propinas', icon: '📚' },
      { name: 'Material Escolar', icon: '✏️' },
      { name: 'Roupa / Calçado', icon: '👕' },
      { name: 'Brinquedos / Jogos', icon: '🧸' },
      { name: 'Actividades Extra', icon: '⚽' },
      { name: 'Saúde / Médico', icon: '🏥' },
      { name: 'Alimentação Infantil', icon: '🍼' },
      { name: 'Explicações / Tutoria', icon: '👨‍🏫' },
      { name: 'Transporte Escolar', icon: '🚌' },
      { name: 'Viagens / Passeios', icon: '✈️' },
    ],
  },
  {
    name: 'Educação',
    icon: '📚',
    color: '#ff8c42',
    builtinKey: 'education',
    subcategories: [
      { name: 'Propinas / Universidade', icon: '🎓' },
      { name: 'Cursos Online', icon: '💻' },
      { name: 'Livros / Material', icon: '📖' },
      { name: 'Formação Profissional', icon: '🏆' },
      { name: 'Línguas / Idiomas', icon: '🌍' },
    ],
  },
  {
    name: 'Lazer',
    icon: '🎬',
    color: '#9c7aff',
    builtinKey: 'leisure',
    subcategories: [
      { name: 'Cinema / Teatro', icon: '🎭' },
      { name: 'Restaurante / Jantar Fora', icon: '🍷' },
      { name: 'Streaming (Netflix, etc.)', icon: '📺' },
      { name: 'Viagens / Férias', icon: '✈️' },
      { name: 'Jogos / Videojogos', icon: '🎮' },
      { name: 'Concertos / Eventos', icon: '🎵' },
      { name: 'Hobbies', icon: '🎨' },
      { name: 'Livros / Revistas', icon: '📰' },
    ],
  },
  {
    name: 'Vestuário',
    icon: '👕',
    color: '#ff6b9d',
    builtinKey: 'clothing',
    subcategories: [
      { name: 'Roupa Casual', icon: '👚' },
      { name: 'Roupa Formal / Trabalho', icon: '👔' },
      { name: 'Calçado', icon: '👟' },
      { name: 'Acessórios', icon: '👜' },
      { name: 'Roupa Desportiva', icon: '🏃' },
      { name: 'Lavandaria / Costura', icon: '🧵' },
    ],
  },
  {
    name: 'Tecnologia',
    icon: '💻',
    color: '#00d4ff',
    builtinKey: 'technology',
    subcategories: [
      { name: 'Telemóvel / Tablet', icon: '📱' },
      { name: 'Computador / Portátil', icon: '💻' },
      { name: 'Acessórios / Periféricos', icon: '🖱️' },
      { name: 'Software / Apps', icon: '⚙️' },
      { name: 'Reparação / Assistência', icon: '🔧' },
      { name: 'Subscrições Tech', icon: '☁️' },
    ],
  },
  {
    name: 'Poupanças',
    icon: '💰',
    color: '#1dd1a1',
    builtinKey: 'savings',
    subcategories: [
      { name: 'Fundo de Emergência', icon: '🛡️' },
      { name: 'Investimento', icon: '📈' },
      { name: 'Depósito a Prazo', icon: '🏦' },
      { name: 'Objectivo Específico', icon: '🎯' },
    ],
  },
  {
    name: 'Crédito',
    icon: '🏦',
    color: '#e879f9',
    builtinKey: 'credit',
    subcategories: [
      { name: 'Prestação Mensal', icon: '📆' },
      { name: 'Amortização Extra', icon: '⬆️' },
      { name: 'Juros / Encargos', icon: '📊' },
    ],
  },
  {
    name: 'Outros',
    icon: '📦',
    color: '#8b91a8',
    builtinKey: 'other',
    subcategories: [
      { name: 'Donativos / Caridade', icon: '❤️' },
      { name: 'Presentes', icon: '🎁' },
      { name: 'Impostos / Taxas', icon: '🧾' },
      { name: 'Seguros', icon: '📋' },
      { name: 'Beleza / Cuidados Pessoais', icon: '💆' },
      { name: 'Animais de Estimação', icon: '🐾' },
    ],
  },
]

export const EMOJI_PICKER = [
  '🏠','🚗','⛽','🔧','🚿','🛒','🍽️','☕','🥡','💊','👨‍⚕️','🦷','💉',
  '📚','🎓','💻','📱','🎬','✈️','🏋️','⚽','🎮','🎵','👕','👔','👟',
  '💰','🏦','📈','🎯','🛡️','💡','💧','📡','❄️','🔌','🧹','🛋️',
  '👶','🍼','🧸','✏️','👨‍🏫','🌍','🎨','📖','🎭','🍷','📺',
  '❤️','🎁','🧾','📋','💆','🐾','🔑','⚙️','🌐','🏢','🏘️',
  '🍕','🍎','🥗','🏥','💼','🚌','🅿️','🔩','🏆','☁️','📰',
]

export const COLOR_PALETTE = [
  '#f26060','#ff8c42','#e8b84b','#3ecf8e','#1dd1a1','#00d4ff',
  '#5b8ff9','#9c7aff','#e879f9','#ff6b9d','#ff9f43','#8b91a8',
  '#f97316','#84cc16','#06b6d4','#8b5cf6','#ec4899','#14b8a6',
  '#f43f5e','#a3e635','#0ea5e9','#d946ef','#fb923c','#64748b',
]
