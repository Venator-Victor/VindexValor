import { useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';

export const useCategorySpending = (categoryId, period) => {
  const { transactions } = useFinance();
  const { user } = useAuth();

  const spendingData = useMemo(() => {
    if (!user || !categoryId || !period) return { currentSpending: 0, transactionCount: 0 };

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'diario':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'semanal':
        const day = startDate.getDay();
        const diff = startDate.getDate() - day;
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'quinzenal':
        const currentDay = startDate.getDate();
        if (currentDay <= 15) {
          startDate.setDate(1);
        } else {
          startDate.setDate(16);
        }
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'mensal':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate.setDate(1);
    }

    const filteredTransactions = transactions.filter(t => {
      const tDate = new Date(t.date + 'T12:00:00');
      return (
        t.category === categoryId &&
        t.type === 'expense' &&
        tDate >= startDate &&
        tDate <= now &&
        t.user_id === user.id
      );
    });

    const currentSpending = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      currentSpending,
      transactionCount: filteredTransactions.length,
      startDate,
      endDate: now
    };
  }, [transactions, categoryId, period, user]);

  return spendingData;
};

export default useCategorySpending;