export const DEFAULT_ACCOUNTS = [
  { 
    id: 'cc-principal',
    name: 'Conta Principal',
    type: 'checking',
    icon: 'bx-wallet', 
    color: '#3B82F6', 
    description: 'Movimentação diária' 
  },
  { 
    id: 'poupanca',
    name: 'Reserva de Emergência',
    type: 'savings',
    icon: 'bx-shield', 
    color: '#10B981', 
    description: 'Economias e segurança' 
  },
  { 
    id: 'cartao-credito',
    name: 'Cartão de Crédito',
    type: 'credit_card',
    icon: 'bx-credit-card', 
    color: '#8B5CF6', 
    description: 'Compras a prazo',
    credit_limit: '0'
  },
  { 
    id: 'investments',
    name: 'Carteira de Investimentos',
    type: 'investment',
    icon: 'bx-trending-up', 
    color: '#F59E0B', 
    description: 'Ações, FIIs e Renda Fixa' 
  },
  { 
    id: 'vr',
    name: 'Vale Refeição',
    type: 'meal_voucher',
    icon: 'bx-restaurant', 
    color: '#EF4444', 
    description: 'Alimentação diária' 
  },
  { 
    id: 'va',
    name: 'Vale Alimentação',
    type: 'food_voucher',
    icon: 'bx-cart', 
    color: '#F97316', 
    description: 'Compras de mercado' 
  },
  { 
    id: 'dinheiro',
    name: 'Carteira Física',
    type: 'cash',
    icon: 'bx-money', 
    color: '#059669', 
    description: 'Dinheiro em espécie' 
  },
  { 
    id: 'cripto',
    name: 'Criptomoedas',
    type: 'crypto',
    icon: 'bx-bitcoin', 
    color: '#EAB308', 
    description: 'Bitcoin e Altcoins' 
  },
  { 
    id: 'emprestimo',
    name: 'Empréstimo Pessoal',
    type: 'loan',
    icon: 'bx-building-house', 
    color: '#64748B', 
    description: 'Financiamentos e dívidas' 
  },
  { 
    id: 'bens',
    name: 'Bens e Patrimônio',
    type: 'assets',
    icon: 'bx-car', 
    color: '#6366F1', 
    description: 'Veículos e Imóveis' 
  },
  { 
    id: 'conjunta',
    name: 'Conta Conjunta',
    type: 'joint_account',
    icon: 'bx-group', 
    color: '#EC4899', 
    description: 'Finanças compartilhadas',
    holders: []
  },
  { 
    id: 'pagamentos',
    name: 'Conta de Pagamentos',
    type: 'payment_account',
    icon: 'bx-credit-card', 
    color: '#0EA5E9', 
    description: 'Movimentações rápidas' 
  }
];