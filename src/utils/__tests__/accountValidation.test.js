import { describe, it, expect } from 'vitest';
import { validateCreditCardAccount } from '../accountValidation';

describe('validateCreditCardAccount', () => {
  describe('non credit-card accounts', () => {
    it('always passes for a checking account', () => {
      expect(validateCreditCardAccount({ type: 'Conta Corrente' })).toEqual({ isValid: true });
    });

    it('always passes for an investment account', () => {
      expect(validateCreditCardAccount({ type: 'Investimentos' })).toEqual({ isValid: true });
    });

    it('ignores credit_limit / initial_balance for non credit-card types', () => {
      expect(validateCreditCardAccount({ type: 'Poupança', initial_balance: 0, credit_limit: 0 })).toEqual({ isValid: true });
    });
  });

  describe('credit-card accounts (type field)', () => {
    const base = { type: 'Cartão de Crédito', credit_limit: 5000 };

    it('passes when required fields are valid', () => {
      expect(validateCreditCardAccount(base)).toEqual({ isValid: true });
    });

    it('fails when initial_balance is non-zero', () => {
      const result = validateCreditCardAccount({ ...base, initial_balance: 100 });
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('passes when initial_balance is 0', () => {
      expect(validateCreditCardAccount({ ...base, initial_balance: 0 })).toEqual({ isValid: true });
    });

    it('fails when credit_limit is missing', () => {
      const result = validateCreditCardAccount({ type: 'Cartão de Crédito' });
      expect(result.isValid).toBe(false);
    });

    it('fails when credit_limit is 0', () => {
      const result = validateCreditCardAccount({ type: 'Cartão de Crédito', credit_limit: 0 });
      expect(result.isValid).toBe(false);
    });

    it('fails when credit_limit is negative', () => {
      const result = validateCreditCardAccount({ type: 'Cartão de Crédito', credit_limit: -100 });
      expect(result.isValid).toBe(false);
    });
  });

  describe('credit-card accounts (account_subtype field)', () => {
    it('identifies credit card by account_subtype regardless of type field', () => {
      const result = validateCreditCardAccount({
        type: 'Outros',
        account_subtype: 'credit_card',
        initial_balance: 200,
        credit_limit: 1000,
      });
      expect(result.isValid).toBe(false);
    });
  });
});
