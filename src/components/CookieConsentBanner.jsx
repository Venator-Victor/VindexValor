import React from 'react';
import { useConsent } from '@/context/ConsentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Cookie } from '@/components/BxIcon';
const CookieConsentBanner = () => {
  const { hasConsented, acceptAll, rejectNonEssential, setIsModalOpen } = useConsent();

  return (
    <AnimatePresence>
      {!hasConsented && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none"
        >
          <div className="container mx-auto max-w-5xl pointer-events-auto">
            <div className="bg-card text-card-foreground border border-border shadow-2xl rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
              {/* Background Accent */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex-1 space-y-2 z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Cookie className="text-primary" size={24} />
                  <h3 className="font-bold text-lg">Sua Privacidade é Importante</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência de navegação, 
                  analisar o tráfego do site e personalizar conteúdo. Ao clicar em "Aceitar Tudo", você 
                  concorda com o armazenamento de cookies no seu dispositivo. Consulte nossa{' '}
                  <Link to="/privacy" className="text-primary font-medium hover:underline">
                    Política de Privacidade
                  </Link> para mais detalhes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 z-10">
                <Button 
                  variant="outline" 
                  onClick={() => setIsModalOpen(true)}
                  className="whitespace-nowrap"
                >
                  Personalizar
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={rejectNonEssential}
                  className="whitespace-nowrap"
                >
                  Rejeitar Não Essenciais
                </Button>
                <Button 
                  onClick={acceptAll}
                  className="whitespace-nowrap shadow-md"
                >
                  Aceitar Tudo
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;