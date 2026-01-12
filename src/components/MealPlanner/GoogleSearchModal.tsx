/**
 * Google Search Modal
 * Embeds Google search with selected ingredients and provides copy URL functionality
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
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
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
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleCopyUrl}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#002B4D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Copy URL
            </button>
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
        </div>

        {/* Search Info */}
        <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>
            Searching for: <strong>{ingredients.join(', ')}</strong>
          </p>
        </div>

        {/* Google Search iframe */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {searchUrl ? (
            <iframe
              src={searchUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                minHeight: '600px'
              }}
              title="Google Recipe Search"
            />
          ) : (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: '#6b7280' 
            }}>
              No ingredients selected for search
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
