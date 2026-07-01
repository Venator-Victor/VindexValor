import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConsent } from '@/context/ConsentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ShieldAlt as ShieldCheck, Pulse as Activity, Target, Cog as Settings2 } from '@/components/BxIcon';
const CookiePreferencesModal = () => {
  const { t } = useTranslation();
  const { preferences, isModalOpen, setIsModalOpen, saveConsent, acceptAll, rejectNonEssential } = useConsent();
  
  // Local state for the form
  const [localPrefs, setLocalPrefs] = useState(preferences);

  // Sync local state when modal opens or preferences change (adjust state during render, per React docs).
  const syncKey = `${isModalOpen}|${JSON.stringify(preferences)}`;
  const [syncedKey, setSyncedKey] = useState(syncKey);
  if (syncKey !== syncedKey) {
    setSyncedKey(syncKey);
    setLocalPrefs(preferences);
  }

  const handleSave = () => {
    saveConsent(localPrefs);
  };

  const categories = [
    {
      id: 'essential',
      title: t('cookie.essential_title'),
      icon: <ShieldCheck size={20} className="text-primary" />,
      description: t('cookie.essential_desc'),
      forced: true
    },
    {
      id: 'preferences',
      title: t('cookie.preferences_title'),
      icon: <Settings2 size={20} className="text-blue-500" />,
      description: t('cookie.preferences_desc'),
      forced: false
    },
    {
      id: 'analytics',
      title: t('cookie.analytics_title'),
      icon: <Activity size={20} className="text-orange-500" />,
      description: t('cookie.analytics_desc'),
      forced: false
    },
    {
      id: 'marketing',
      title: t('cookie.marketing_title'),
      icon: <Target size={20} className="text-purple-500" />,
      description: t('cookie.marketing_desc'),
      forced: false
    }
  ];

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t('cookie.modal_title')}</DialogTitle>
          <DialogDescription className="text-base">
            {t('cookie.modal_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-start gap-4 p-4 border border-border rounded-xl bg-card">
              <div className="mt-1 bg-muted p-2 rounded-lg">
                {cat.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground text-lg">{cat.title}</h3>
                  {cat.forced ? (
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded">{t('cookie.always_active')}</span>
                  ) : (
                    <Switch
                      checked={localPrefs[cat.id]}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, [cat.id]: checked }))}
                      aria-label={t('cookie.toggle_category', { category: cat.title })}
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 sm:justify-between border-t border-border pt-4">
          <Button variant="outline" onClick={() => rejectNonEssential()} className="w-full sm:w-auto">
            {t('cookie.reject_non_essential')}
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={handleSave} className="w-full sm:w-auto">
              {t('cookie.save_choices')}
            </Button>
            <Button onClick={() => acceptAll()} className="w-full sm:w-auto">
              {t('cookie.accept_all_modal')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePreferencesModal;