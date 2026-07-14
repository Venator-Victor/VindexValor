import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import SelectInput from '@/components/ui/SelectInput';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useInvoiceCSVImport } from '@/hooks/useInvoiceCSVImport';
import { Share as UploadCloud, AlertCircle, File as FileText, RefreshCw as Loader2, X } from '@/components/BxIcon';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { computeInvoiceBalances } from '@/utils/invoiceBalance';
import { suggestIsPayment, suggestIsCarryover } from '@/utils/paymentDetection';
import MultiFileImportResults from './MultiFileImportResults';
import ColumnMappingStep from './ColumnMappingStep';
import PaymentReviewStep from './PaymentReviewStep';

// step: 'upload' | 'mapping' | 'review-payments' | 'processing' | 'completed'
const CSVImportFlowFaturas = ({ onSuccess, onCancel }) => {
  const { t, i18n } = useTranslation();
  const { accounts, createInvoice } = useFinance();
  const { user } = useAuth();
  const { parseFilesRaw, autoDetectMapping, applyMapping, importData } = useInvoiceCSVImport();
  const { toast } = useToast();

  const [step, setStep] = useState('upload');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedAccountForAuto, setSelectedAccountForAuto] = useState('');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [mapping, setMapping] = useState({ date: '', description: '', amount: '' });
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [filesData, setFilesData] = useState([]);
  const [isPreparingReview, setIsPreparingReview] = useState(false);
  // The account's existing invoice (if any) and its carried balance, as of before this
  // import batch — a confirmed payment row in the first new invoice settles this one.
  const [previousInvoice, setPreviousInvoice] = useState({ id: null, balance: 0, hasLinkedPayment: false });

  const fileInputRef = useRef(null);

  const creditCardAccounts = accounts.filter(
    a => a.type === 'credit_card' || a.account_subtype === 'credit_card'
  );

  const handleFileSelected = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx) => setSelectedFiles(prev => prev.filter((_, i) => i !== idx));

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleProceedToMapping = async () => {
    if (selectedFiles.length === 0) return;
    if (!selectedAccountForAuto) {
      toast({ title: t('invoices.import_select_account_title'), description: t('invoices.import_select_account_desc'), variant: 'destructive' });
      return;
    }
    try {
      const { headers } = await parseFilesRaw([selectedFiles[0]]);
      setRawHeaders(headers);
      setMapping(autoDetectMapping(headers));
      setStep('mapping');
    } catch (err) {
      toast({ title: t('invoices.import_generic_error_title'), description: err.message || t('invoices.import_read_file_error'), variant: 'destructive' });
    }
  };

  // Fetches the given account's existing invoices/items and returns the id + closing
  // balance of the most recently closed one — the reference point new imports would
  // carry in as their opening balance, used both to suggest which line is the payment
  // settlement and (once confirmed) to mark that invoice paid.
  const fetchPreviousBalance = async (accountId) => {
    const { data: accountInvoices } = await supabase
      .from('invoices')
      .select('id, account_id, closing_date, status')
      .eq('account_id', accountId);

    if (!accountInvoices || accountInvoices.length === 0) return { id: null, balance: 0 };

    const { data: accountItems } = await supabase
      .from('invoice_items')
      .select('invoice_id, amount')
      .in('invoice_id', accountInvoices.map(inv => inv.id));

    // Any transaction can be linked as a payment (expense/transfer/payment — see
    // InvoicePaymentLinkModal's eligible-payments query), so what actually settles an
    // invoice is invoice_id being set, not the transaction's type.
    const { data: accountPayments } = await supabase
      .from('transactions')
      .select('invoice_id, amount')
      .in('invoice_id', accountInvoices.map(inv => inv.id));

    const itemsByInvoiceId = {};
    (accountItems || []).forEach(item => {
      if (!itemsByInvoiceId[item.invoice_id]) itemsByInvoiceId[item.invoice_id] = [];
      itemsByInvoiceId[item.invoice_id].push(item);
    });

    const paymentsByInvoiceId = {};
    (accountPayments || []).forEach(p => {
      if (!paymentsByInvoiceId[p.invoice_id]) paymentsByInvoiceId[p.invoice_id] = [];
      paymentsByInvoiceId[p.invoice_id].push(p);
    });

    const balances = computeInvoiceBalances(accountInvoices, itemsByInvoiceId, paymentsByInvoiceId);
    const latest = [...accountInvoices].sort((a, b) => new Date(b.closing_date) - new Date(a.closing_date))[0];
    return {
      id: latest.id,
      balance: balances[latest.id]?.closingBalance || 0,
      // A confirmed payment row here would settle `latest` — if it already has a linked
      // transaction payment, that'd double-count the same real-world payment.
      hasLinkedPayment: (paymentsByInvoiceId[latest.id] || []).length > 0,
    };
  };

  const handleMappingConfirmed = async () => {
    setIsPreparingReview(true);
    try {
      const previousInvoice = await fetchPreviousBalance(selectedAccountForAuto);
      setPreviousInvoice(previousInvoice);

      // Rolled forward file-by-file: file 2's payment line settles file 1's balance,
      // not the batch's original pre-existing balance — same carry-forward processBatch
      // uses once rows are confirmed, done here too so the suggestion for each later
      // file is actually compared against what it would owe, not a stale reference.
      let referenceBalance = previousInvoice.balance;
      const data = [];
      for (const file of selectedFiles) {
        const { data: rawData } = await parseFilesRaw([file]);
        const rows = applyMapping(rawData, mapping).map(row => ({
          ...row,
          is_payment: suggestIsPayment(row, referenceBalance),
          is_carryover: suggestIsCarryover(row, referenceBalance)
        }));
        data.push({ fileName: file.name, rows });

        const itemsTotal = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        referenceBalance = referenceBalance + itemsTotal;
      }
      setFilesData(data);

      const hasCandidates = data.some(f => f.rows.some(r => Number(r.amount) > 0 || r.is_carryover));
      setStep(hasCandidates ? 'review-payments' : 'processing');
      // Pass the just-fetched value directly rather than relying on the
      // setPreviousInvoice state update above, which hasn't flushed yet here.
      if (!hasCandidates) await processBatch(data, previousInvoice);
    } catch (err) {
      toast({ title: t('invoices.import_generic_error_title'), description: err.message || t('invoices.import_read_file_error'), variant: 'destructive' });
    } finally {
      setIsPreparingReview(false);
    }
  };

  const togglePaymentFlag = (fileIdx, rowIdx) => {
    setFilesData(prev => prev.map((f, fi) => fi !== fileIdx ? f : {
      ...f,
      rows: f.rows.map((r, ri) => ri !== rowIdx ? r : { ...r, is_payment: !r.is_payment })
    }));
  };

  const toggleCarryoverFlag = (fileIdx, rowIdx) => {
    setFilesData(prev => prev.map((f, fi) => fi !== fileIdx ? f : {
      ...f,
      rows: f.rows.map((r, ri) => ri !== rowIdx ? r : { ...r, is_carryover: !r.is_carryover })
    }));
  };

  const processBatch = async (dataToProcess, startingInvoice = previousInvoice) => {
    setStep('processing');
    setResults([]);
    setCurrentFileIndex(0);

    const newResults = [];
    let successCount = 0;
    let errorCount = 0;

    // Chains through the batch the same way computeInvoiceBalances carries a balance
    // invoice-to-invoice: each file's confirmed payment rows settle the previous
    // invoice (starting with the account's pre-existing one), then this file's own
    // invoice becomes what the *next* file's payment needs to cover.
    let invoiceToSettle = startingInvoice.id;
    let priorBalance = startingInvoice.balance;

    for (let i = 0; i < dataToProcess.length; i++) {
      setCurrentFileIndex(i);
      const { fileName, rows } = dataToProcess[i];
      let resultItem = { fileName, status: 'error', count: 0, error: '' };

      try {
        if (rows.length === 0) throw new Error(t('invoices.import_no_valid_data'));

        const dates = rows.map(m => new Date(m.date)).filter(d => !isNaN(d.getTime()));
        let autoFaturaName = t('invoices.default_name_fallback');
        let minDateStr = new Date().toISOString().split('T')[0];
        let maxDateStr = new Date().toISOString().split('T')[0];

        if (dates.length > 0) {
          const earliest = new Date(Math.min(...dates));
          const nextMonthDate = new Date(earliest.getUTCFullYear(), earliest.getUTCMonth() + 1, 1);
          const monthStr = nextMonthDate.toLocaleString(i18n.language, { month: 'short', timeZone: 'UTC' });
          const yearStr = nextMonthDate.getUTCFullYear();
          autoFaturaName = `${t('invoices.default_name_prefix')} ${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}/${yearStr}`;
          minDateStr = earliest.toISOString().split('T')[0];
          maxDateStr = nextMonthDate.toISOString().split('T')[0];
        }

        const newFatura = await createInvoice({
          invoice_number: autoFaturaName,
          account_id: selectedAccountForAuto,
          opening_date: minDateStr,
          closing_date: maxDateStr,
          status: 'open',
        });

        if (!newFatura?.id) throw new Error(t('invoices.import_create_error'));

        const { count } = await importData(newFatura.id, rows);
        resultItem = { ...resultItem, status: 'success', count };
        successCount++;

        const itemsTotal = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        const hasConfirmedPayment = rows.some(r => r.is_payment);

        // Trust the user's confirmation from the review step over our own reconciliation —
        // real statements rarely match the computed balance to the cent (interest, fees,
        // rounding), so requiring an exact/over match silently skipped almost every invoice.
        if (invoiceToSettle && hasConfirmedPayment) {
          await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceToSettle).eq('user_id', user.id);
        }

        invoiceToSettle = newFatura.id;
        priorBalance = priorBalance + itemsTotal;
      } catch (err) {
        resultItem.error = err.message || t('invoices.import_unknown_file_error');
        errorCount++;
      }

      newResults.push(resultItem);
      setResults([...newResults]);
    }

    setStep('completed');
    toast({
      title: t('invoices.import_batch_title'),
      description: t('invoices.import_batch_desc', { success: successCount, errors: errorCount }),
      variant: errorCount > 0 ? 'destructive' : 'default',
    });

    if (successCount > 0) onSuccess();
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setStep('upload');
    setResults([]);
    setCurrentFileIndex(0);
    setFilesData([]);
  };

  if (step === 'completed') {
    return <MultiFileImportResults results={results} onClear={handleClear} />;
  }

  if (step === 'mapping') {
    return (
      <ColumnMappingStep
        headers={rawHeaders}
        mapping={mapping}
        onChange={setMapping}
        onConfirm={handleMappingConfirmed}
        onBack={() => setStep('upload')}
        isLoading={isPreparingReview}
      />
    );
  }

  if (step === 'review-payments') {
    return (
      <PaymentReviewStep
        filesData={filesData}
        onToggle={togglePaymentFlag}
        onToggleCarryover={toggleCarryoverFlag}
        onBack={() => setStep('mapping')}
        onConfirm={() => processBatch(filesData)}
        showAlreadySettledWarning={previousInvoice.hasLinkedPayment}
      />
    );
  }

  const isProcessing = step === 'processing';

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div className="p-1">
        <div className={`border-2 border-dashed border-border rounded-xl p-6 md:p-8 text-center flex flex-col items-center justify-center bg-muted/30 transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">{t('invoices.import_bulk_title')}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {t('invoices.import_bulk_desc')}
          </p>
          <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
            {t('invoices.import_select_files_button')}
          </Button>
          <input type="file" accept=".csv" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelected} />
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="bg-card p-4 rounded-xl border">
              <h4 className="font-semibold text-sm mb-3">{t('invoices.import_selected_files_title', { count: selectedFiles.length })}</h4>
              <ul className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                {selectedFiles.map((file, idx) => (
                  <li key={`${file.name}-${file.size}-${file.lastModified}`} className={`flex items-center justify-between p-2 rounded-lg border text-sm ${isProcessing && currentFileIndex === idx ? 'border-primary bg-primary/5' : 'bg-background'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                    </div>
                    {!isProcessing ? (
                      <button onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive shrink-0 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    ) : isProcessing && currentFileIndex === idx ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card p-4 rounded-xl border">
              <SelectInput
                label={t('invoices.import_credit_card_account_label')}
                value={selectedAccountForAuto}
                onChange={(e) => setSelectedAccountForAuto(e.target.value)}
                options={[
                  { label: t('invoices.import_select_card_placeholder'), value: '' },
                  ...creditCardAccounts.map(a => ({ label: a.name, value: a.id })),
                ]}
                disabled={isProcessing}
                required
              />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="mt-4 p-4 bg-primary/10 rounded-xl flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="font-medium text-primary">
              {t('invoices.import_processing_status', { current: currentFileIndex + 1, total: selectedFiles.length })}
            </span>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing} className="w-full sm:w-auto">
            {t('common.cancel')}
          </Button>
          {selectedFiles.length > 0 && (
            <Button
              onClick={handleProceedToMapping}
              disabled={isProcessing || !selectedAccountForAuto}
              className="w-full sm:w-auto"
            >
              {t('invoices.import_continue_to_mapping')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportFlowFaturas;