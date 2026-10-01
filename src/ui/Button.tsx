import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'soft';
  size?: 'md' | 'lg';
  icon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, className = '', children, ...rest }: ButtonProps) {
  const sizing = size === 'lg' ? 'min-h-14 px-7 text-lg' : 'min-h-11 px-5 text-base';
  const tone = variant === 'primary' ? '' : variant;
  return (
    <button
      type="button"
      className={`toy-btn ${tone} ${sizing} inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold select-none ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
