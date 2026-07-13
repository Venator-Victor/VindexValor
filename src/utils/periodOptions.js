// English values — stored in recurring_items.frequency, goals.period_frequency, categories.budget_period
export const PERIOD_OPTIONS = [
  { label: 'Diário',     value: 'daily' },
  { label: 'Semanal',    value: 'weekly' },
  { label: 'Quinzenal',  value: 'biweekly' },
  { label: 'Mensal',     value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Semestral',  value: 'semiannual' },
  { label: 'Anual',      value: 'yearly' },
];

// Subset used for goal contribution frequency (daily → monthly only)
export const CONTRIBUTION_PERIOD_OPTIONS = PERIOD_OPTIONS.slice(0, 4);