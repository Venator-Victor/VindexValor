import React, { useState, useEffect } from 'react';
import { useConsent } from '@/context/ConsentContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ShieldAlt as ShieldCheck, Pulse as Activity, Target, Cog as Settings2 } from '@/components/BxIcon';
const CookiePreferencesModal = () => {
  const { preferences, isModalOpen, setIsModalOpen, saveConsent, acceptAll, rejectNonEssential } = useConsent();
  
  // Local state for the form
  const [localPrefs, setLocalPrefs] = useState(preferences);

  // Sync local state when modal opens or preferences change
  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences, isModalOpen]);

  const handleSave = () => {
    saveConsent(localPrefs);
  };

  const categories = [
    {
      id: 'essential',
      title: 'Cookies Essenciais',
      icon: <ShieldCheck size={20} className="text-primary" />,
      description: 'Estes cookies são necessários para o funcionamento do site, como autenticação de usuário e segurança. Eles não podem ser desativados.',
      forced: true
    },
    {
      id: 'preferences',
      title: 'Cookies de Preferências',
      icon: <Settings2 size={20} className="text-blue-500" />,
      description: 'Permitem que o site lembre de escolhas que você faz (como seu idioma ou região) e forneça recursos aprimorados e mais pessoais.',
      forced: false
    },
    {
      id: 'analytics',
      title: 'Cookies Analíticos',
      icon: <Activity size={20} className="text-orange-500" />,
      description: 'Nos ajudam a entender como os visitantes interagem com o site, coletando e relatando informações anonimamente.',
      forced: false
    },
    {
      id: 'marketing',
      title: 'Cookies de Marketing',
      icon: <Target size={20} className="text-purple-500" />,
      description: 'Usados para rastrear visitantes em sites. A intenção é exibir anúncios que sejam relevantes e envolventes para o usuário individual.',
      forced: false
    }
  ];

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Preferências de Privacidade</DialogTitle>
          <DialogDescription className="text-base">
            Utilizamos cookies para melhorar sua experiência. Personalize suas preferências abaixo de acordo com a finalidade desejada.
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
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded">Sempre Ativo</span>
                  ) : (
                    <Switch 
                      checked={localPrefs[cat.id]}
                      onCheckedChange={(checked) => setLocalPrefs(prev => ({ ...prev, [cat.id]: checked }))}
                      aria-label={`Alternar ${cat.title}`}
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
            Rejeitar Não Essenciais
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={handleSave} className="w-full sm:w-auto">
              Salvar Minhas Escolhas
            </Button>
            <Button onClick={() => acceptAll()} className="w-full sm:w-auto">
              Aceitar Todos
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePreferencesModal;