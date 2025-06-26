'use client';

import { ModalProps } from '@/lib/types';

export default function Modal({ isOpen, onClose, children }: ModalProps & { children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-4" style={{ zIndex: 1050 }}>
      <div className="bg-white rounded shadow-lg" style={{ maxWidth: '42rem', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
} 