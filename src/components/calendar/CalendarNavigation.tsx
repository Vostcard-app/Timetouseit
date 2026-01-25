/**
 * Calendar Navigation Component
 * Month navigation controls for the calendar
 */

import React from 'react';
import { format } from 'date-fns';
import { combineStyles, buttonStyles } from '../../styles/componentStyles';
import { spacing } from '../../styles/designTokens';

interface CalendarNavigationProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onListClick?: () => void;
}

export const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  currentDate,
  onNavigate,
  onListClick
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: spacing.md }}>
        <button
          onClick={() => onNavigate('prev')}
          style={combineStyles(
            buttonStyles.secondary,
            {
              padding: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px'
            }
          )}
          aria-label="Previous Month"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => onNavigate('next')}
          style={combineStyles(
            buttonStyles.secondary,
            {
              padding: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px'
            }
          )}
          aria-label="Next Month"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {onListClick && (
        <button
          onClick={onListClick}
          style={combineStyles(buttonStyles.primary, { fontSize: '0.875rem', padding: `${spacing.sm} ${spacing.md}` })}
        >
          List View
        </button>
      )}
    </div>
  );
};
