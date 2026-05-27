export const INVESTMENT_TYPES = {
  RENDA_FIXA: 'Renda Fixa',
  RENDA_VARIAVEL: 'Renda Variável',
  FUNDO: 'Fundo'
};

export const INVESTMENT_SUBTYPES = {
  [INVESTMENT_TYPES.RENDA_FIXA]: [
    'Poupança',
    'CDB',
    'LCI/LCA',
    'CRI/CRA',
    'LC',
    'Debêntures',
    'LF',
    'Tesouro Direto'
  ],
  [INVESTMENT_TYPES.RENDA_VARIAVEL]: [
    'Ações',
    'BDRs',
    'Fundos de investimentos',
    'Fundos imobiliários',
    'ETFs'
  ],
  [INVESTMENT_TYPES.FUNDO]: [] // No subtypes
};

export const getTypeOptions = () => Object.values(INVESTMENT_TYPES).map(type => ({ label: type, value: type }));

export const getSubtypeOptions = (type) => {
  if (!type || !INVESTMENT_SUBTYPES[type]) return [];
  return INVESTMENT_SUBTYPES[type].map(subtype => ({ label: subtype, value: subtype }));
};