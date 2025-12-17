'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { HelpModal } from './HelpModal';

interface HelpIconProps {
  topicKey: string;
  size?: number;
  className?: string;
}

export const HelpIcon: React.FC<HelpIconProps> = ({ 
  topicKey, 
  size = 16, 
  className = '' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`
          inline-flex items-center justify-center
          text-blue-600 hover:text-blue-800
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          rounded-full
          ${className}
        `}
        title="Get help about this field"
        aria-label={`Help about ${topicKey}`}
      >
        <HelpCircle size={size} />
      </button>

      {isModalOpen && (
        <HelpModal 
          topicKey={topicKey} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};
