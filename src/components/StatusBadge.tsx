import React from 'react';
import type { FoodItemStatus } from '../types';
import { getStatusColor, getStatusLabel, getStatusBgColor } from '../utils/statusUtils';

interface StatusBadgeProps {
  status: FoodItemStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const color = getStatusColor(status);
  const bgColor = getStatusBgColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: bgColor,
        color: color,
        border: `1px solid ${color}`
      }}
    >
      {label}
    </span>
  );
};

export default StatusBadge;

