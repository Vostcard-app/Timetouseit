/**
 * Google Search Modal
 * Shows Google search URL with selected ingredients and provides copy/open functionality
 */

import React, { useMemo } from 'react';
import { showToast } from '../Toast';

interface GoogleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: string[];
}

export const GoogleSearchModal: React.FC<GoogleSearchModalProps> = ({
  isOpen,
  onClose,
  ingredients
}) => {
  // Build Google search URL with ingredients
  const searchUrl = useMemo(() => {
    if (ingredients.length === 0) return '';
    const query = `${ingredients.join(' ')} recipe`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }, [ingredients]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(searchUrl);
      showToast('Search URL copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      showToast('Failed to copy URL. Please try again.', 'error');
    }
  };

  const handleOpenInGoogle = () => {
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1003,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid #e5e7eb', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            Google Recipe Search
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.25rem 0.5rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Search Info */}
        <div style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
              Searching for:
            </p>
            <p style={{ margin: 0, fontSize: '1rem', color: '#1f2937', fontWeight: '600' }}>
              {ingredients.join(', ')} recipe
            </p>
          </div>

          {/* Search URL Display */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
              Search URL:
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '0.875rem', 
              color: '#6b7280',
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {searchUrl}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCopyUrl}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#1f2937',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Copy URL
            </button>
            <button
              onClick={handleOpenInGoogle}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#002B4D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Open in Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
