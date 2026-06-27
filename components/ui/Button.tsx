'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#F7C948]/40';

    const variants = {
      primary: 'bg-[#F7C948] text-[#0A0A0F] hover:bg-[#E6B830] active:bg-[#D4A820]',
      secondary: 'bg-[#1E1E2E] text-[#F0F0F5] hover:bg-[#2A2A3A] border border-[#2A2A3A] hover:border-[#3A3A4A]',
      ghost: 'text-[#8888A0] hover:text-[#F0F0F5] hover:bg-[#1E1E2E]',
      danger: 'bg-[#F87171]/10 text-[#F87171] hover:bg-[#F87171]/20 border border-[#F87171]/30',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-3 gap-2',
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
