/**
 * PhotoUploadSection Component
 * Handles photo upload and preview
 */

import React from 'react';

interface PhotoUploadSectionProps {
  photoPreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
}

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  photoPreview,
  fileInputRef,
  onPhotoChange,
  onRemovePhoto
}) => {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label htmlFor="photo" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '1rem' }}>
        Photo (optional)
      </label>
      <input
        ref={fileInputRef}
        type="file"
        id="photo"
        name="photo"
        accept="image/*"
        onChange={onPhotoChange}
        style={{ display: 'none' }}
      />
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
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
          {photoPreview ? 'Change Photo' : 'Upload Photo'}
        </button>
        {photoPreview && (
          <>
            <img
              src={photoPreview}
              alt="Preview"
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '6px',
                border: '1px solid #d1d5db'
              }}
            />
            <button
              type="button"
              onClick={onRemovePhoto}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
};

