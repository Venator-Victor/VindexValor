import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const ColumnMappingStep = ({ headers, mapping, onChange, onConfirm, onBack }) => {
  const { t } = useTranslation();

  const FIELDS = [
    { key: 'date',        label: t('csv.field_date'),        required: true },
    { key: 'description', label: t('csv.field_description'), required: true },
    { key: 'amount',      label: t('csv.field_amount'),       required: true },
  ];

  const canConfirm = FIELDS.filter(f => f.required).every(f => mapping[f.key]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-semibold text-foreground mb-1">{t('csv.mapping_title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('csv.mapping_desc')}
        </p>
      </div>

      <div className="bg-muted/30 rounded-xl border p-4 flex flex-col gap-4">
        {FIELDS.map(field => (
          <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-medium text-foreground w-28 shrink-0">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </label>
            <select
              value={mapping[field.key] || ''}
              onChange={e => onChange({ ...mapping, [field.key]: e.target.value })}
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground hover:border-primary focus:border-primary outline-none"
            >
              <option value="">{t('csv.select_column')}</option>
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {!canConfirm && (
        <p className="text-xs text-destructive">{t('csv.required_fields_error')}</p>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          {t('csv.back')}
        </Button>
        <Button onClick={onConfirm} disabled={!canConfirm} className="w-full sm:w-auto">
          {t('csv.continue')}
        </Button>
      </div>
    </div>
  );
};

export default ColumnMappingStep;