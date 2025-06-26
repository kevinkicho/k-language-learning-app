'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  sm: 'spinner-border-sm',
  md: 'spinner-border',
  lg: 'spinner-border-lg',
};

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`d-flex justify-content-center align-items-center ${className}`}>
      <div className={`${spinnerSizes[size]} text-primary`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
} 