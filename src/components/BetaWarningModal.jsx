import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Target, TrendingUp, BarChart as BarChart3, X } from '@/components/BxIcon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const BetaWarningModal = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-2xl font-bold">{t('beta.title')}</DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground">
            {t('beta.intro')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm font-medium text-foreground">
            {t('beta.unstable_intro')}
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="bg-muted p-1.5 rounded-md text-foreground mt-0.5">
                <TrendingUp size={16} />
              </div>
              <div>
                <strong className="text-foreground block">{t('beta.investments_title')}</strong>
                {t('beta.investments_desc')}
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="bg-muted p-1.5 rounded-md text-foreground mt-0.5">
                <BarChart3 size={16} />
              </div>
              <div>
                <strong className="text-foreground block">{t('beta.analytics_title')}</strong>
                {t('beta.analytics_desc')}
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="bg-muted p-1.5 rounded-md text-foreground mt-0.5">
                <Target size={16} />
              </div>
              <div>
                <strong className="text-foreground block">{t('beta.goals_title')}</strong>
                {t('beta.goals_desc')}
              </div>
            </li>
          </ul>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {t('beta.understood')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BetaWarningModal;