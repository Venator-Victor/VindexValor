import { DANGER, DANGER_DARK, SUCCESS, chartGrid, chartText, chartCursor } from '@/utils/colors';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ComposedChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/utils/calculations';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { matchesDateFilter } from '@/utils/dateFilter';
import { formatMonthYear as formatMonthYearShared } from '@/utils/chartDateFormat';
import { Eye, EyeSlash } from '@/components/BxIcon';

const formatYAxis = (v) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return v;
};

const formatMonthYear = (dateStr, lang) => {
  if (!dateStr) return '-';
  return formatMonthYearShared(new Date(`${dateStr}T12:00:00`), lang);
};

const CustomTooltip = ({ active, payload, t }) => {
  if (active && payload && payload.length) {
    // Read the date off the hovered point's own row (payload[i].payload) rather than
    // the axis `label` prop — multiple invoices can share the same closing_date, and
    // Recharts resolves `label` by matching that (non-unique) axis value, which can
    // land on the wrong invoice. The row data itself is always the exact point hovered.
    const displayDate = payload[0]?.payload?.displayDate;
    return (
      <div className="bg-white dark:bg-vindex-card p-3 border border-gray-200 dark:border-vindex-border rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{displayDate}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.dataKey === 'expenses' ? t('invoices.chart_expenses_label') : t('invoices.chart_paid_label')}
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// One point per invoice, in the same order as the invoices list — each invoice's own
// "Value" column is deliberately non-cumulative (a payment settles the *previous*
// invoice, not this one), and this chart mirrors that exact figure as its main line
// instead of a running balance. The second line plots what was paid *through* each
// invoice's statement (its is_payment items plus any transaction linked to it) as its
// own series, so the two can be compared side by side without conflating them.
const InvoiceBalanceChart = ({ dateFilter }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAxis, setShowAxis] = useState(true);
  const { invoices: allInvoices, invoiceItems, transactions } = useFinance();

  // Same filter the invoices list itself applies (by opening_date), so the graph
  // always reflects whatever period the page's date filter is currently set to.
  const invoices = useMemo(
    () => allInvoices.filter(inv => matchesDateFilter(inv.opening_date, dateFilter)),
    [allInvoices, dateFilter]
  );

  const data = useMemo(() => {
    const itemsByInvoiceId = {};
    invoiceItems.forEach(item => {
      if (!itemsByInvoiceId[item.invoice_id]) itemsByInvoiceId[item.invoice_id] = [];
      itemsByInvoiceId[item.invoice_id].push(item);
    });

    // Any transaction can be linked as a payment (expense/transfer/payment — see
    // InvoicePaymentLinkModal's eligible-payments query), so what actually settles an
    // invoice is invoice_id being set, not the transaction's type.
    const paymentsByInvoiceId = {};
    transactions.forEach(tx => {
      if (!tx.invoice_id) return;
      if (!paymentsByInvoiceId[tx.invoice_id]) paymentsByInvoiceId[tx.invoice_id] = [];
      paymentsByInvoiceId[tx.invoice_id].push(tx);
    });

    const sorted = [...invoices].sort((a, b) =>
      new Date(a.closing_date) - new Date(b.closing_date) || new Date(a.opening_date) - new Date(b.opening_date)
    );

    return sorted.map((inv, idx) => {
      const items = itemsByInvoiceId[inv.id] || [];
      const payments = paymentsByInvoiceId[inv.id] || [];

      const expenses = items
        .filter(item => !item.is_payment)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      const paidViaItems = items
        .filter(item => item.is_payment)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const paidViaTransactions = payments.reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);

      return {
        // A plain sequential index — guaranteed unique, used only to position points
        // on the axis. Two invoices can share the same closing_date, and a duplicate
        // axis value is what causes Recharts to mis-resolve tooltip/hover to the wrong
        // point; the actual displayed date lives in `displayDate` instead.
        xKey: idx,
        displayDate: formatMonthYear(inv.closing_date, i18n.language),
        expenses,
        paid: paidViaItems + paidViaTransactions,
      };
    });
  }, [invoices, invoiceItems, transactions, i18n.language]);

  const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
  const totalPaid = data.reduce((sum, d) => sum + d.paid, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-vindex-card rounded-2xl p-6 border border-gray-200 dark:border-vindex-border shadow-sm mb-6 relative"
    >
      <button
          type="button"
          onClick={() => setShowAxis(v => !v)}
          title={showAxis ? t('common.hide_axis_labels') : t('common.show_axis_labels')}
          className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-vindex-bg transition-colors z-10"
      >
          {showAxis ? <Eye size={16} /> : <EyeSlash size={16} />}
      </button>

      <div className="flex flex-wrap justify-center gap-8 md:gap-24 mb-6 pt-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded bg-red-600 dark:bg-vindex-danger" />
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('invoices.chart_expenses_label')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(totalExpenses)}
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-gray-500 dark:text-gray-400 font-medium">{t('invoices.chart_paid_label')}</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(totalPaid)}
          </div>
        </div>
      </div>

      <div className="h-[250px] w-full">
        {data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            {t('invoices.chart_no_data')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="ibcExpensesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? DANGER_DARK : DANGER} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isDark ? DANGER_DARK : DANGER} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ibcPaidGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SUCCESS} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={SUCCESS} stopOpacity={0} />
                </linearGradient>
              </defs>
              {showAxis && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid(isDark)} />}
              <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: chartCursor(isDark) }} />
              <XAxis
                dataKey="xKey"
                tickFormatter={(xKey) => data[xKey]?.displayDate ?? ''}
                tick={showAxis ? { fontSize: 10, fill: chartText(isDark) } : false}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={showAxis ? { fontSize: 10, fill: chartText(isDark) } : false}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatYAxis}
                width={showAxis ? 40 : 0}
              />
              <Area
                type="natural"
                dataKey="expenses"
                stroke={isDark ? DANGER_DARK : DANGER}
                strokeWidth={2}
                fill="url(#ibcExpensesGradient)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="natural"
                dataKey="paid"
                stroke={SUCCESS}
                strokeWidth={2}
                fill="url(#ibcPaidGradient)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default InvoiceBalanceChart;
