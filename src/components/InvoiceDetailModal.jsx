import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/calculations';
import { CreditCard, Edit as Edit2, TrashAlt as Trash2, ArrowRight } from '@/components/BxIcon';
import { PRIMARY, DANGER } from '@/utils/colors';
import { getEffectiveInvoiceStatus } from '@/utils/invoiceBalance';

const STATUS_COLORS = {
  open: '#3b82f6',
  closed: '#eab308',
  paid: '#22c55e',
};

const InvoiceDetailModal = ({ isOpen, onClose, invoice, total, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!invoice) return null;

  const effectiveStatus = getEffectiveInvoiceStatus(invoice);
  const statusColor = STATUS_COLORS[effectiveStatus] || PRIMARY;
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card text-foreground max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
            style={{ backgroundColor: statusColor + '22', borderColor: statusColor + '44' }}
          >
            <CreditCard className="w-6 h-6" style={{ color: statusColor }} />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-lg font-bold break-words" title={invoice.invoice_number}>
              {invoice.invoice_number || t('invoices.unnamed_invoice')}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {formatDate(invoice.opening_date)}
            </p>
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-xl border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">{t('invoices.col_total')}</p>
          <p className={`text-3xl font-bold crypto-symbol ${total < 0 ? 'text-red-600 dark:text-red-400' : total > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
            {formatCurrency(total)}
          </p>
          <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor + '22', color: statusColor }}>
            {t(`invoices.status_${effectiveStatus}`)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-0">
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{t('common.account')}</p>
            <span className="text-sm font-medium truncate block">{invoice.account?.name || t('invoices.account_removed')}</span>
          </div>
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{t('invoices.closing_date')}</p>
            <span className="text-sm font-medium truncate block">{formatDate(invoice.closing_date)}</span>
          </div>
        </div>

        <Button type="button" variant="outline" onClick={() => { onClose(); navigate(`/invoices/${invoice.id}`); }} className="w-full gap-2">
          {t('invoices.view_purchases')} <ArrowRight className="w-4 h-4" />
        </Button>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { onClose(); onEdit(invoice); }}
            className="flex-1 gap-1"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            {t('common.edit')}
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { onClose(); onDelete(invoice.id); }}
              className="flex-1 gap-1"
              style={{ borderColor: DANGER, color: DANGER }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('common.delete')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailModal;
