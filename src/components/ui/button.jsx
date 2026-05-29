import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 'bg-primary text-gray-900 hover:bg-primary/85 shadow-md hover:shadow-lg',
				destructive:
          'bg-red-600 text-white hover:bg-red-700 dark:bg-vindex-danger dark:text-white dark:hover:bg-[#c9254a] shadow-sm hover:shadow-md',
				outline:
          'border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 dark:border-vindex-border dark:bg-transparent dark:hover:bg-vindex-border/80 dark:hover:text-primary',
				secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-vindex-border dark:text-vindex-text dark:hover:bg-vindex-border/80',
				ghost: 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-vindex-border/50 dark:hover:text-primary',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };