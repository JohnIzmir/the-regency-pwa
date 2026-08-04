import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md border border-pub-wood-light bg-pub-surface2 px-3 py-2 text-sm text-pub-cream',
        'placeholder:text-pub-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-gold',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
