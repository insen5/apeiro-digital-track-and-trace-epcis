'use client';

import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Package, 
  Plane, 
  Activity 
} from 'lucide-react';

export type ProductStatusType = 
  | 'ACTIVE' 
  | 'LOST' 
  | 'STOLEN' 
  | 'DAMAGED' 
  | 'SAMPLE' 
  | 'EXPORT' 
  | 'DISPENSING';

interface StatusBadgeProps {
  status: ProductStatusType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<ProductStatusType, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = {
  ACTIVE: {
    label: 'Active',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
  },
  LOST: {
    label: 'Lost',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: XCircle,
  },
  STOLEN: {
    label: 'Stolen',
    color: 'text-red-900',
    bgColor: 'bg-red-200',
    icon: AlertCircle,
  },
  DAMAGED: {
    label: 'Damaged',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
    icon: AlertTriangle,
  },
  SAMPLE: {
    label: 'Sample',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    icon: Package,
  },
  EXPORT: {
    label: 'Export',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    icon: Plane,
  },
  DISPENSING: {
    label: 'Dispensing',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
    icon: Activity,
  },
};

const sizeConfig = {
  sm: {
    text: 'text-xs',
    padding: 'px-2 py-0.5',
    iconSize: 12,
  },
  md: {
    text: 'text-sm',
    padding: 'px-2.5 py-0.5',
    iconSize: 14,
  },
  lg: {
    text: 'text-base',
    padding: 'px-3 py-1',
    iconSize: 16,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showIcon = true 
}) => {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Unknown
      </span>
    );
  }

  return (
    <span 
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${config.bgColor} ${config.color}
        ${sizeStyles.text} ${sizeStyles.padding}
      `}
    >
      {showIcon && <Icon size={sizeStyles.iconSize} />}
      {config.label}
    </span>
  );
};
