/**
 * usePhotoUpload Hook
 * Handles photo file selection, preview, and upload state
 */

import { useState, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { analyticsService } from '../services/analyticsService';

interface UsePhotoUploadProps {
  initialPhotoUrl?: string | null;
}

export function usePhotoUpload({ initialPhotoUrl }: UsePhotoUploadProps = {}) {
  const [user] = useAuthState(auth);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      
      // Track engagement: feature_used (photo upload)
      if (user) {
        analyticsService.trackEngagement(user.uid, 'feature_used', {
          feature: 'photo_upload',
        });
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return {
    photoFile,
    photoPreview,
    fileInputRef,
    handlePhotoChange,
    handleRemovePhoto,
    openFileDialog,
    setPhotoPreview
  };
}

