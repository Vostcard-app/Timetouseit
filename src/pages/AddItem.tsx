import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import type { FoodItemData } from '../types';
import { foodItemService } from '../services/firebaseService';
import { getFoodItemStatus } from '../utils/statusUtils';
import AddItemForm from '../components/AddItemForm';
import BarcodeScanner from '../components/BarcodeScanner';
import type { BarcodeScanResult } from '../services/barcodeService';

const AddItem: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | undefined>(
    searchParams.get('barcode') || undefined
  );

  const handleSubmit = async (data: FoodItemData, photoFile?: File) => {
    if (!user) {
      alert('You must be logged in to add items');
      navigate('/login');
      return;
    }

    try {
      // Upload photo if provided
      let photoUrl: string | undefined = undefined;
      if (photoFile) {
        photoUrl = await foodItemService.uploadPhoto(user.uid, photoFile);
      }

      // Build itemData without undefined fields
      const itemData: FoodItemData = {
        name: data.name,
        expirationDate: data.expirationDate,
        quantity: data.quantity || 1,
        barcode: scannedBarcode || data.barcode || undefined
      };
      
      // Only include optional fields if they have values
      if (data.category) itemData.category = data.category;
      if (data.notes) itemData.notes = data.notes;
      if (photoUrl) itemData.photoUrl = photoUrl;

      const status = getFoodItemStatus(data.expirationDate);
      await foodItemService.addFoodItem(user.uid, itemData, status);
      
      // Navigate back to dashboard
      navigate('/');
    } catch (error) {
      console.error('Error adding food item:', error);
      throw error;
    }
  };

  const handleScan = (result: BarcodeScanResult) => {
    setScannedBarcode(result.data);
    setShowScanner(false);
  };

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Please log in to add food items.</p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#002B4D',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#002B4D',
            border: '1px solid #002B4D',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: '700', color: '#1f2937' }}>
          Add Food Item
        </h1>
      </div>

      {showScanner ? (
        <div>
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => setShowScanner(true)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#f3f4f6',
                color: '#1f2937',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              📷 Scan Barcode
            </button>
          </div>
          <AddItemForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/')}
            initialBarcode={scannedBarcode}
          />
        </>
      )}
    </div>
  );
};

export default AddItem;

