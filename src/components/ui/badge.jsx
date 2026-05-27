import React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-gray-100 text-gray-900 dark:bg-vindex-bg dark:text-vindex-text',
    secondary: 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300',
    destructive: 'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-300',
    outline: 'border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';

export { Badge };