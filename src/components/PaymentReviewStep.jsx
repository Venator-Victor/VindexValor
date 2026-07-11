import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { File as FileText, Wallet } from '@/components/BxIcon';
import { formatCurrency } from '@/utils/calculations';

// Lets the user confirm/override which imported lines are the credit card's "payment
// received" settlement (as opposed to a purchase or genuine refund), before anything
// is written to the database. Auto-suggestions (by description wording or by amount
// matching what was owed on the previous invoice) are pre-checked but never final on
// their own — the user always has the last word here.
const PaymentReviewStep = ({ filesData, onToggle, onBack, onConfirm }) => {
  const { t } = useTranslation();

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div>
        <h3 className="font-semibold text-foreground mb-1">{t('invoices.review_payments_title')}</h3>
        <p className="text-sm text-muted-foreground">{t('invoices.review_payments_desc')}</p>
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
        {filesData.map((file, fileIdx) => {
          const candidateRows = file.rows
            .map((row, rowIdx) => ({ row, rowIdx }))
            .filter(({ row }) => Number(row.amount) > 0);

          if (candidateRows.length === 0) return null;

          return (
            <div key={file.fileName} className="bg-muted/30 rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{file.fileName}</span>
              </div>
              <div className="space-y-2">
                {candidateRows.map(({ row, rowIdx }) => (
                  <label
                    key={rowIdx}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:border-primary cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={row.is_payment}
                      onCheckedChange={() => onToggle(fileIdx, rowIdx)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate" title={row.description}>{row.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(row.date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                      {formatCurrency(row.amount)}
                    </span>
                    {row.is_payment && (
                      <Wallet className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">{t('invoices.review_payments_checkbox_hint')}</p>

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          {t('csv.back')}
        </Button>
        <Button onClick={onConfirm} className="w-full sm:w-auto">
          {t('invoices.review_payments_confirm_button')}
        </Button>
      </div>
    </div>
  );
};

export default PaymentReviewStep;
