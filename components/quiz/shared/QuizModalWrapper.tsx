'use client';

import { ReactNode } from 'react';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface QuizModalWrapperProps {
  isLoading?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function QuizModalWrapper({
  isLoading = false,
  title,
  onClose,
  children,
  size = 'lg',
  className = ''
}: QuizModalWrapperProps) {
  if (isLoading) {
    return (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
              <LoadingSpinner />
              <p className="mt-3">Loading Quiz...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sizeClass = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl'
  }[size];

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className={`modal-dialog modal-dialog-centered modal-fullscreen-sm-down ${sizeClass} ${className}`}>
        <div className="modal-content bg-dark text-white shadow-lg">
          <div className="modal-header bg-primary text-white border-0">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-question-circle me-2"></i>
              {title}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 