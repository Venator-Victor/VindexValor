import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import SelectInput from '@/components/ui/SelectInput';
import { useFinance } from '@/context/FinanceContext';
import { useCSVImport } from '@/hooks/useCSVImport';
import CSVPreviewTable from './CSVPreviewTable';
import ColumnMappingStep from './ColumnMappingStep';
import { Share as UploadCloud } from '@/components/BxIcon';
import { useAutoMappingCategories } from '@/hooks/useAutoMappingCategories';

// step: 'upload' | 'mapping' | 'preview'
const CSVImportFlow = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { accounts } = useFinance();
  const { parseMultipleCSVsRaw, autoDetectMapping, applyColumnMapping, importData, isParsing, isImporting } = useCSVImport();
  const { getSuggestedCategory, saveCategoryMapping } = useAutoMappingCategories();

  const [step, setStep] = useState('upload');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [mapping, setMapping] = useState({ date: '', description: '', amount: '' });
  const [parsedData, setParsedData] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelected = async (e) => {
    setError(null);
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const { headers, data } = await parseMultipleCSVsRaw(e.target.files);
      setRawHeaders(headers);
      setRawData(data);
      setMapping(autoDetectMapping(headers));
      setStep('mapping');
    } catch (err) {
      setError(err.message || t('csv.processing_error'));
    }
  };

  const handleMappingConfirm = () => {
    const rows = applyColumnMapping(rawData, mapping).map(row => ({
      ...row,
      category_id: getSuggestedCategory(row.description) || '',
      autoMapped: !!getSuggestedCategory(row.description),
      manuallyMapped: false,
    }));
    setParsedData(rows);
    setStep('preview');
  };

  const handleUpdateRow = (index, updatedRow) => {
    const newData = [...parsedData];
    newData[index] = { ...updatedRow, autoMapped: false, manuallyMapped: true };
    setParsedData(newData);
  };

  const handleImport = async () => {
    if (!selectedAccount || !parsedData) {
      setError(t('csv.no_account_error'));
      return;
    }
    setError(null);
    try {
      const count = await importData(parsedData, selectedAccount);
      parsedData.forEach(row => {
        if (row.manuallyMapped && row.category_id && row.description) {
          saveCategoryMapping(row.description, row.category_id);
        }
      });
      onSuccess(count);
    } catch (err) {
      setError(err.message || t('csv.import_error'));
    }
  };

  if (step === 'upload') {
    return (
      <div className="p-1">
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center bg-muted/30">
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">{t('csv.upload_title')}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {t('csv.upload_step_hint')}
          </p>
          <Button onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
            {isParsing ? t('csv.processing_button') : t('csv.choose_files_button')}
          </Button>
          <input type="file" accept=".csv" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelected} />
          {error && <div className="mt-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg w-full">{error}</div>}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">{t('common.cancel')}</Button>
        </div>
      </div>
    );
  }

  if (step === 'mapping') {
    return (
      <ColumnMappingStep
        headers={rawHeaders}
        mapping={mapping}
        onChange={setMapping}
        onConfirm={handleMappingConfirm}
        onBack={() => setStep('upload')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <CSVPreviewTable data={parsedData} onUpdateRow={handleUpdateRow} />

      <div className="bg-muted/30 p-5 rounded-xl border">
        <SelectInput
          label={`${t('csv.destination_account')} *`}
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          options={[
            { label: t('csv.select_account_placeholder'), value: '' },
            ...accounts.map(acc => ({ label: acc.name, value: acc.id })),
          ]}
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          {t('csv.destination_account_hint')}
        </p>
      </div>

      {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2">
        <Button variant="outline" onClick={() => setStep('mapping')} disabled={isImporting}>
          {t('csv.back')}
        </Button>
        <Button onClick={handleImport} disabled={!selectedAccount || isImporting}>
          {isImporting ? t('csv.importing_button') : t('csv.confirm_import_button', { count: parsedData.length })}
        </Button>
      </div>
    </div>
  );
};

export default CSVImportFlow;