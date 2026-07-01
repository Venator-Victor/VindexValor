import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { Check, X, ArrowRight, Wallet, Receipt, Tag, Target } from '@/components/BxIcon';

const STORAGE_KEY = 'vindex_onboarding_dismissed';

const OnboardingChecklist = () => {
  const { t } = useTranslation();
  const { accounts, transactions, categories, goals, invoices } = useFinance();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  const steps = [
    {
      id: 'conta',
      label: t('onboarding.step_account_label'),
      description: t('onboarding.step_account_desc'),
      path: '/accounts',
      Icon: Wallet,
      done: accounts.length > 0,
    },
    {
      id: 'transacao',
      label: t('onboarding.step_transaction_label'),
      description: t('onboarding.step_transaction_desc'),
      path: '/transactions',
      Icon: Receipt,
      done: transactions.length > 0 || invoices.length > 0,
    },
    {
      id: 'categoria',
      label: t('onboarding.step_category_label'),
      description: t('onboarding.step_category_desc'),
      path: '/categories',
      Icon: Tag,
      done: categories.length > 0,
    },
    {
      id: 'meta',
      label: t('onboarding.step_goal_label'),
      description: t('onboarding.step_goal_desc'),
      path: '/goals',
      Icon: Target,
      done: goals.length > 0,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="bg-white dark:bg-vindex-card rounded-xl border border-primary/30 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-vindex-border/50">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-vindex-text">
                {allDone ? t('onboarding.setup_complete') : t('onboarding.first_steps')}
              </p>
              <p className="text-xs text-gray-500 dark:text-vindex-text/50 mt-0.5">
                {t('onboarding.steps_completed', { done: completedCount, total: steps.length })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress bar */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 h-1.5 bg-gray-100 dark:bg-vindex-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-xs text-gray-400 dark:text-vindex-text/40 font-mono">
                {Math.round((completedCount / steps.length) * 100)}%
              </span>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-vindex-text hover:bg-gray-100 dark:hover:bg-vindex-border/50 transition-colors"
              title={t('onboarding.close')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="divide-y divide-gray-50 dark:divide-vindex-border/30">
          {steps.map((step) => (
            <Link
              key={step.id}
              to={step.done ? '#' : step.path}
              onClick={step.done ? (e) => e.preventDefault() : undefined}
              className={`flex items-center gap-4 px-6 py-4 transition-colors group ${
                step.done
                  ? 'opacity-50 cursor-default'
                  : 'hover:bg-gray-50 dark:hover:bg-vindex-bg/50 cursor-pointer'
              }`}
            >
              {/* Status icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                step.done
                  ? 'bg-primary/15 text-primary'
                  : 'bg-gray-100 dark:bg-vindex-border/50 text-gray-400 dark:text-vindex-text/40 group-hover:bg-primary/10 group-hover:text-primary'
              }`}>
                {step.done ? <Check size={16} /> : <step.Icon size={16} />}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? 'line-through text-gray-400 dark:text-vindex-text/40' : 'text-gray-900 dark:text-vindex-text'}`}>
                  {step.label}
                </p>
                {!step.done && (
                  <p className="text-xs text-gray-500 dark:text-vindex-text/50 mt-0.5 truncate">{step.description}</p>
                )}
              </div>

              {/* Arrow */}
              {!step.done && (
                <ArrowRight size={16} className="text-gray-300 dark:text-vindex-text/30 group-hover:text-primary flex-shrink-0 transition-colors" />
              )}
            </Link>
          ))}
        </div>

        {/* Footer */}
        {allDone && (
          <div className="px-6 py-3 bg-primary/5 border-t border-primary/20 flex items-center justify-between">
            <p className="text-sm text-primary font-medium">{t('onboarding.all_done')}</p>
            <button onClick={handleDismiss} className="text-sm text-primary hover:underline">{t('onboarding.close')}</button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingChecklist;