import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold tracking-wide uppercase text-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-neutral-800 focus-visible:ring-black',
        primary: 'bg-black text-white hover:bg-neutral-800 focus-visible:ring-black',
        secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus-visible:ring-neutral-200',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
        gold: 'bg-gold text-black hover:bg-accent-600 focus-visible:ring-gold',
        outline:
          'border-2 border-black bg-transparent text-black hover:bg-black hover:text-white focus-visible:ring-black',
        ghost: 'text-black hover:bg-neutral-100 focus-visible:ring-black',
        link: 'text-black underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 py-2 text-xs',
        md: 'h-11 px-6 py-3 text-sm',
        lg: 'h-14 px-8 py-4 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
