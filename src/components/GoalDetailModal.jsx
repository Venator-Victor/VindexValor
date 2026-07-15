import React from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInDays, isPast, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/calculations';
import CircularProgressBar from '@/components/CircularProgressBar';
import { useFinance } from '@/context/FinanceContext';
import { Edit as Edit2, TrashAlt as Trash2 } from '@/components/BxIcon';
import BxIcon from '@/components/BxIcon';
import { PRIMARY, DANGER } from '@/utils/colors';

const GoalDetailModal = ({ isOpen, onClose, goal, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();
  const { accounts } = useFinance();

  if (!goal) return null;

  const isTargetMode = goal.goal_type === 'target_value';
  const reservations = goal.accountReservations || [];
  const accumulated = Number(goal.accumulated_amount) || 0;
  const targetValue = Number(isTargetMode ? goal.targetAmount : goal.contributionValue) || 0;
  const percentage = targetValue > 0 ? Math.min((accumulated / targetValue) * 100, 100) : 0;

  const isAchieved = isTargetMode && percentage >= 100;
  const isOverdue = goal.deadline && isPast(parseISO(goal.deadline)) && !isAchieved;
  const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card text-foreground max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="p-6 border-b border-border pb-4 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: goal.color + '22', borderColor: goal.color + '44' }}
              >
                <BxIcon iconClass={`bx ${goal.icon || 'bx-target-lock'}`} size={24} style={{ color: goal.color }} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">{goal.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {isTargetMode ? t('goals.type_fixed') : t('goals.type_recurring')}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30">
              <p className="text-xs text-green-700 dark:text-green-400 mb-1">{t('goals.accumulated')}</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{formatCurrency(accumulated)}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">{isTargetMode ? t('goals.target_total') : t('goals.target_period')}</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(targetValue)}</p>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {goal.deadline ? new Date(goal.deadline).toLocaleDateString(i18n.language, { timeZone: 'UTC' }) : t('goals.no_deadline')}
              </p>
              {goal.deadline && (
                <p className={`text-xs mt-1 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {isOverdue ? t('goals.overdue_card') : t('goals.days_left_full', { count: daysLeft })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <CircularProgressBar
                current={accumulated}
                max={targetValue}
                size={50}
                showBudget={false}
                strokeWidth={5}
                mode="progress"
              />
              <span className="text-sm font-bold">{percentage.toFixed(0)}%</span>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { onClose(); onEdit(goal); }}
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
                onClick={() => onDelete(goal.id)}
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
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <h4 className="text-sm font-bold text-foreground mb-3 sticky top-0 bg-card py-2">
            {t('goals.account_reservations_label')}
          </h4>

          <div className="space-y-2">
            {reservations.length > 0 ? (
              reservations.map((res) => {
                const account = accounts.find(a => a.id === res.account_id);
                return (
                  <div key={res.account_id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
                    <p className="font-medium text-sm text-foreground truncate pr-2">{account?.name || '-'}</p>
                    <p className="font-bold text-sm whitespace-nowrap pl-2">{formatCurrency(res.amount)}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">{t('goals.no_accounts_linked')}</p>
            )}
          </div>

          {goal.description && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-bold text-foreground mb-2">{t('goals.description_label')}</h4>
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalDetailModal;