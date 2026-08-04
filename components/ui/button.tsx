import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors ' +
    'disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-pub-gold focus-visible:ring-offset-2 focus-visible:ring-offset-pub-bg',
  {
    variants: {
      variant: {
        default: 'bg-pub-gold text-pub-bg hover:bg-pub-gold-light',
        secondary: 'bg-pub-green text-pub-cream hover:bg-pub-green-light',
        outline: 'border border-pub-gold text-pub-gold hover:bg-pub-gold hover:text-pub-bg',
        ghost: 'text-pub-cream hover:bg-pub-surface2',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
        link: 'text-pub-gold underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
