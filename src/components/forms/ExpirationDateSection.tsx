/**
 * ExpirationDateSection Component
 * Handles expiration date input and AI helper button
 */

import React, { useRef } from 'react';

interface ExpirationDateSectionProps {
  expirationDate: Date | undefined;
  qualityMessage: string | null;
  isDryCanned: boolean | undefined;
  isLoadingAI: boolean;
  hasCredits: boolean;
  onDateChange: (date: Date) => void;
  onExpirationHelper: () => void;
  showHelper?: boolean;
}

export const ExpirationDateSection: React.FC<ExpirationDateSectionProps> = ({
  expirationDate,
  qualityMessage,
  isDryCanned,
  isLoadingAI,
  hasCredits,
  onDateChange,
  onExpirationHelper,
  showHelper = true
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(new Date(e.target.value));
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label htmlFor="expirationDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '1rem' }}>
        Expiration Date * (Dates are suggestions not guarantees)
      </label>
      <input
        ref={dateInputRef}
        type="date"
        id="expirationDate"
        name="expirationDate"
        value={expirationDate ? expirationDate.toISOString().split('T')[0] : ''}
        onChange={handleDateChange}
        required
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '1rem'
        }}
      />
      {/* Show quality message for dry/canned goods */}
      {isDryCanned && qualityMessage && (
        <p style={{ 
          margin: '0.5rem 0 0 0', 
          fontSize: '0.875rem', 
          color: '#6b7280', 
          fontStyle: 'italic' 
        }}>
          {qualityMessage}
        </p>
      )}
      {/* Expiration Helper Button */}
      {showHelper && (
        <button
          type="button"
          onClick={onExpirationHelper}
          disabled={isLoadingAI || !hasCredits}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: hasCredits ? '#002B4D' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: hasCredits ? 'pointer' : 'not-allowed',
            opacity: isLoadingAI ? 0.6 : 1
          }}
        >
          {isLoadingAI ? 'Loading...' : 'Expiration Helper'}
        </button>
      )}
    </div>
  );
};

