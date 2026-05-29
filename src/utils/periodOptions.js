// Title-case values — used in form selectors and frequency pickers
export const PERIOD_OPTIONS = [
  { label: 'Diário',     value: 'Diário' },
  { label: 'Semanal',    value: 'Semanal' },
  { label: 'Quinzenal',  value: 'Quinzenal' },
  { label: 'Mensal',     value: 'Mensal' },
  { label: 'Trimestral', value: 'Trimestral' },
  { label: 'Semestral',  value: 'Semestral' },
  { label: 'Anual',      value: 'Anual' },
];

// Lowercase values — used in chart/filter period selectors stored in settings
export const CHART_PERIOD_OPTIONS = [
  { label: 'Diário',     value: 'diario' },
  { label: 'Semanal',    value: 'semanal' },
  { label: 'Quinzenal',  value: 'quinzenal' },
  { label: 'Mensal',     value: 'mensal' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Semestral',  value: 'semestral' },
  { label: 'Anual',      value: 'anual' },
];

// Subset used for goal contribution frequency (Diário → Mensal only)
export const CONTRIBUTION_PERIOD_OPTIONS = PERIOD_OPTIONS.slice(0, 4);
