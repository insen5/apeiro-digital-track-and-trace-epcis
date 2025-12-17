"use client";

import React from "react";
import { MdClose } from "react-icons/md";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'lg',
}) => {
  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    fullscreen: 'w-screen h-screen max-w-none m-0 rounded-none',
  };

  const isFullscreen = size === 'fullscreen';

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex justify-center items-center p-4">
      <div className={`bg-card shadow-2xl border border-border w-full ${sizeClasses[size]} ${isFullscreen ? 'h-screen flex flex-col rounded-none' : 'max-h-[90vh] overflow-y-auto rounded-xl'} relative`}>
        <div className={`${isFullscreen ? 'flex-shrink-0' : 'sticky top-0'} bg-card border-b border-border p-6 pb-4 z-10 flex items-center justify-between`}>
          {title && <h2 className="text-2xl font-bold text-foreground">{title}</h2>}
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full p-1 transition-colors"
            aria-label="Close modal"
          >
            <MdClose size={28} />
          </button>
        </div>
        <div className={isFullscreen ? 'flex-1 overflow-y-auto p-6 pt-4' : ''}>{children}</div>
      </div>
    </div>
  );
};
