import React from 'react';
import { Button } from '@/components/ui/button';

const FIELDS = [
  { key: 'date',        label: 'Data',      required: true },
  { key: 'description', label: 'Descrição', required: true },
  { key: 'amount',      label: 'Valor',     required: true },
];

const ColumnMappingStep = ({ headers, mapping, onChange, onConfirm, onBack }) => {
  const canConfirm = FIELDS.filter(f => f.required).every(f => mapping[f.key]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-semibold text-foreground mb-1">Mapeamento de Colunas</h3>
        <p className="text-sm text-muted-foreground">
          Selecione qual coluna do CSV corresponde a cada campo. Os valores detectados automaticamente já estão pré-selecionados.
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
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">Selecione a coluna...</option>
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {!canConfirm && (
        <p className="text-xs text-destructive">Selecione todas as colunas obrigatórias para continuar.</p>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          Voltar
        </Button>
        <Button onClick={onConfirm} disabled={!canConfirm} className="w-full sm:w-auto">
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default ColumnMappingStep;