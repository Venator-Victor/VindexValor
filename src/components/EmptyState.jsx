import React from 'react';
import { Button } from '@/components/ui/button';

const EmptyState = ({ icon: Icon, message, buttonLabel, onButtonClick }) => (
  <div className="text-center py-12 bg-white dark:bg-vindex-card rounded-xl border border-gray-200 dark:border-vindex-border border-dashed">
    {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />}
    <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
    {buttonLabel && onButtonClick && (
      <Button onClick={onButtonClick}>{buttonLabel}</Button>
    )}
  </div>
);

export default EmptyState;
