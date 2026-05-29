export const DEFAULT_ACCOUNTS = [
  { 
    id: 'cc-principal', 
    name: 'Conta Principal', 
    type: 'Conta Corrente', 
    icon: 'bx-wallet', 
    color: '#3B82F6', 
    description: 'Movimentação diária' 
  },
  { 
    id: 'poupanca', 
    name: 'Reserva de Emergência', 
    type: 'Poupança', 
    icon: 'bx-shield', 
    color: '#10B981', 
    description: 'Economias e segurança' 
  },
  { 
    id: 'cartao-credito', 
    name: 'Cartão de Crédito', 
    type: 'Cartão de Crédito', 
    icon: 'bx-credit-card', 
    color: '#8B5CF6', 
    description: 'Compras a prazo',
    credit_limit: '0'
  },
  { 
    id: 'investimentos', 
    name: 'Carteira de Investimentos', 
    type: 'Investimentos', 
    icon: 'bx-trending-up', 
    color: '#F59E0B', 
    description: 'Ações, FIIs e Renda Fixa' 
  },
  { 
    id: 'vr', 
    name: 'Vale Refeição', 
    type: 'Vale-Refeição', 
    icon: 'bx-restaurant', 
    color: '#EF4444', 
    description: 'Alimentação diária' 
  },
  { 
    id: 'va', 
    name: 'Vale Alimentação', 
    type: 'Vale-Alimentação', 
    icon: 'bx-cart', 
    color: '#F97316', 
    description: 'Compras de mercado' 
  },
  { 
    id: 'dinheiro', 
    name: 'Carteira Física', 
    type: 'Dinheiro', 
    icon: 'bx-money', 
    color: '#059669', 
    description: 'Dinheiro em espécie' 
  },
  { 
    id: 'cripto', 
    name: 'Criptomoedas', 
    type: 'Cripto', 
    icon: 'bx-bitcoin', 
    color: '#EAB308', 
    description: 'Bitcoin e Altcoins' 
  },
  { 
    id: 'emprestimo', 
    name: 'Empréstimo Pessoal', 
    type: 'Empréstimos', 
    icon: 'bx-building-house', 
    color: '#64748B', 
    description: 'Financiamentos e dívidas' 
  },
  { 
    id: 'bens', 
    name: 'Bens e Patrimônio', 
    type: 'Bens', 
    icon: 'bx-car', 
    color: '#6366F1', 
    description: 'Veículos e Imóveis' 
  },
  { 
    id: 'conjunta', 
    name: 'Conta Conjunta', 
    type: 'Conta Conjunta', 
    icon: 'bx-group', 
    color: '#EC4899', 
    description: 'Finanças compartilhadas',
    holders: []
  },
  { 
    id: 'pagamentos', 
    name: 'Conta de Pagamentos', 
    type: 'Conta de Pagamentos', 
    icon: 'bx-credit-card', 
    color: '#0EA5E9', 
    description: 'Movimentações rápidas' 
  }
];