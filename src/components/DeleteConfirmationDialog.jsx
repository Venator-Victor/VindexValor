import React from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DeleteConfirmationDialog = ({ open, onOpenChange, description, onConfirm }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-white dark:bg-vindex-card text-gray-900 dark:text-gray-100 border-gray-200 dark:border-vindex-border rounded-xl">
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
        <AlertDialogDescription className="text-gray-700 dark:text-gray-300">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="bg-gray-100 dark:bg-vindex-bg hover:bg-gray-200 dark:hover:bg-vindex-bg/80 border-gray-200 dark:border-vindex-border text-gray-900 dark:text-gray-100 rounded-lg">
          Cancelar
        </AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90 rounded-lg text-white">
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteConfirmationDialog;
