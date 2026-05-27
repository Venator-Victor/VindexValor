import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Target, TrendingUp, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const BetaWarningModal = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <AlertCircle size={24} />
            </div>
            <DialogTitle className="text-2xl font-bold">VindexValor em Beta</DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground">
            Obrigado por utilizar o VindexValor! Gostaríamos de informar que a plataforma 
            encontra-se atualmente em fase Beta.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-sm font-medium text-foreground">
            As funcionalidades estão em desenvolvimento ativo e podem apresentar instabilidades, principalmente:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="bg-muted p-1.5 rounded-md text-foreground mt-0.5">
                <TrendingUp size={16} />
              </div>
              <div>
                <strong className="text-foreground block">Investimentos</strong>
                Sincronização de rentabilidade e projeção de ativos complexos.
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="bg-muted p-1.5 rounded-md text-foreground mt-0.5">
                <BarChart3 size={16} />
              </div>
              <div>
                <strong className="text-foreground block">Análises Avançadas</strong>
                Relatórios preditivos baseados no histórico de despesas.
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="bg-muted p-1.5 rounded-md text-foreground mt-0.5">
                <Target size={16} />
              </div>
              <div>
                <strong className="text-foreground block">Metas Inteligentes</strong>
                Automação de reservas entre contas.
              </div>
            </li>
          </ul>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BetaWarningModal;