import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle as CheckCircle2, XCircle, ChevronDown, ChevronUp, ArrowToBottom as Download } from '@/components/BxIcon';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/calculations';

const MultiFileImportResults = ({ results, onClear }) => {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState('all');

  const successes = results.filter(r => r.status === 'success');
  const errors = results.filter(r => r.status === 'error');

  const handleDownloadErrors = () => {
    const errorText = errors.map(e => `${t('csv.error_file_label')}: ${e.fileName}\n${t('csv.error_prefix', { message: e.error })}\n\n`).join('');
    const blob = new Blob([errorText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erros_importacao_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col items-center justify-center p-6 border rounded-xl bg-card">
        {errors.length === 0 ? (
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        ) : successes.length === 0 ? (
          <XCircle className="w-16 h-16 text-destructive mb-4" />
        ) : (
          <div className="flex gap-4 mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
        )}
        <h3 className="text-xl font-bold text-foreground mb-1">
          {t('transactions.import_success_title')}
        </h3>
        <p className="text-muted-foreground text-center">
          {t('csv.import_summary', { success: successes.length, errors: errors.length })}
        </p>
      </div>

      {(successes.length > 0 || errors.length > 0) && (
        <div className="border rounded-xl bg-card overflow-hidden">
          <div className="p-4 bg-muted/30 border-b flex justify-between items-center cursor-pointer" onClick={() => setExpandedSection(expandedSection === 'all' ? '' : 'all')}>
            <h4 className="font-semibold">{t('csv.processing_details')}</h4>
            {expandedSection === 'all' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          
          {expandedSection === 'all' && (
            <div className="p-0">
              <ul className="divide-y">
                {results.map((result, idx) => (
                  <li key={idx} className="p-4 flex items-start gap-3 hover:bg-muted/10">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.fileName}</p>
                      {result.status === 'success' ? (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('csv.purchases_imported', { count: result.count })}
                        </p>
                      ) : (
                        <p className="text-xs text-destructive mt-1">
                          {t('csv.error_prefix', { message: result.error })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between gap-3 pt-2">
        {errors.length > 0 ? (
          <Button variant="outline" onClick={handleDownloadErrors} className="gap-2">
            <Download className="w-4 h-4" /> {t('csv.error_report_button')}
          </Button>
        ) : <div />}

        <Button onClick={onClear} className="min-w-[120px]">
          {t('csv.finish_button')}
        </Button>
      </div>
    </div>
  );
};

export default MultiFileImportResults;