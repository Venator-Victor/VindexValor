export const validateCreditCardAccount = (accountData) => {
  const isCreditCard = accountData.type === 'credit_card' || accountData.account_subtype === 'credit_card';
  
  if (isCreditCard) {
    if (accountData.initial_balance && Number(accountData.initial_balance) !== 0) {
      return { isValid: false, error: "Contas de Cartão de Crédito não podem ter saldo inicial." };
    }
    if (!accountData.credit_limit || Number(accountData.credit_limit) <= 0) {
      return { isValid: false, error: "O limite do cartão de crédito deve ser maior que zero." };
    }
  }
  return { isValid: true };
};