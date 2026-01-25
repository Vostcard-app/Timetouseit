/**
 * Calendar Navigation Component
 * Month navigation controls and view options
 */

import React from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { spacing, colors, borderRadius } from '../../styles/designTokens';
import { buttonStyles, combineStyles } from '../../styles/componentStyles';

interface CalendarNavigationProps {
  currentDate: Date;
  onNavigatePeriod: (direction: 'prev' | 'next') => void;
}

export const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  currentDate,
  onNavigatePeriod
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: spacing.md, 
      marginBottom: spacing.lg 
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: spacing.md 
      }}>
        <button
          onClick={() => onNavigatePeriod('prev')}
          style={combineStyles(
            {
              padding: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
            },
            buttonStyles.secondary
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
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.5rem', 
          fontWeight: 600 
        }}>
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => onNavigatePeriod('next')}
          style={combineStyles(
            {
              padding: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
              minHeight: '44px',
            },
            buttonStyles.secondary
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
      <button
        onClick={() => navigate(`/print-meal-list?date=${format(currentDate, 'yyyy-MM-dd')}`)}
        style={combineStyles(
          {
            padding: `${spacing.sm} ${spacing.md}`,
            fontSize: '0.875rem',
            fontWeight: 500,
          },
          buttonStyles.primary
        )}
      >
        List View
      </button>
    </div>
  );
};
