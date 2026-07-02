import React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PRIMARY, DANGER } from '@/utils/colors';

const DeleteConfirmationDialog = ({ open, onOpenChange, description, onConfirm }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl">
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
        <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="flex-row gap-2 sm:justify-stretch">
        <AlertDialogCancel
          className="mt-0 flex-1 rounded-lg focus:ring-0 focus:ring-offset-0"
          style={{ borderColor: PRIMARY, color: PRIMARY, backgroundColor: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = PRIMARY; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = PRIMARY; }}
        >
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="flex-1 rounded-lg border"
          style={{ borderColor: DANGER, color: DANGER, backgroundColor: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = DANGER; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = DANGER; }}
        >
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteConfirmationDialog;
