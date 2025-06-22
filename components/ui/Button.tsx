'use client';

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  size?: 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, loading, variant = 'primary', size, className, ...props }, ref) => {
    const baseClasses = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = size ? `btn-${size}` : '';

    return (
      <button ref={ref} className={`${baseClasses} ${variantClass} ${sizeClass} ${className || ''}`} {...props}>
        {loading ? <LoadingSpinner size="sm" /> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button; 