/**
 * Label Scanner Service
 * Handles AI-powered label scanning for Premium users
 */

import { userSettingsService } from './userSettingsService';
import { logServiceOperation, logServiceError } from './baseService';
import type { LabelScanResult } from '../types/labelScanner';

export const labelScannerService = {
  /**
   * Convert image file to base64 string
   */
  async convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Scan label image and extract item information using AI
   * Premium users only
   */
  async scanLabel(imageFile: File, userId?: string): Promise<LabelScanResult> {
    logServiceOperation('scanLabel', 'labelScannerService', { userId, fileName: imageFile.name });

    // Check if user is Premium
    if (!userId) {
      throw new Error('User ID is required for label scanning');
    }

    let isPremium = false;
    try {
      isPremium = await userSettingsService.isPremiumUser(userId);
    } catch (error) {
      console.error('Error checking premium status:', error);
      throw new Error('Unable to verify premium status');
    }

    if (!isPremium) {
      throw new Error('Label scanning is only available for Premium users');
    }

    try {
      // Convert image to base64
      const imageBase64 = await this.convertImageToBase64(imageFile);

      // Call Netlify function
      const response = await fetch('/.netlify/functions/ai-label-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageBase64 })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Parse and validate result
      const result: LabelScanResult = {
        itemName: data.itemName || 'Unknown Item',
        quantity: data.quantity !== null && data.quantity !== undefined ? Number(data.quantity) : undefined,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null
      };

      // Validate expiration date
      if (result.expirationDate && isNaN(result.expirationDate.getTime())) {
        console.warn('Invalid expiration date received, setting to null');
        result.expirationDate = null;
      }

      logServiceOperation('scanLabel', 'labelScannerService', { 
        userId, 
        itemName: result.itemName,
        hasQuantity: result.quantity !== undefined,
        hasExpirationDate: result.expirationDate !== null
      });

      return result;
    } catch (error) {
      logServiceError('scanLabel', 'labelScannerService', error, { userId, fileName: imageFile.name });
      throw error;
    }
  }
};
