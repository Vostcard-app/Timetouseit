import React, { useEffect, useRef, useState } from 'react';
import { barcodeService } from '../services/barcodeService';
import type { BarcodeScanResult } from '../services/barcodeService';

interface BarcodeScannerProps {
  onScan: (result: BarcodeScanResult) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onError, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCamera = async () => {
      const available = await barcodeService.hasCamera();
      setHasCamera(available);
    };
    checkCamera();
  }, []);

  useEffect(() => {
    if (!videoRef.current || !hasCamera) return;

    const startScanning = async () => {
      try {
        const scanner = await barcodeService.scanBarcode(
          videoRef.current!,
          (result) => {
            onScan(result);
            stopScanning();
          },
          (err) => {
            setError(err.message);
            if (onError) onError(err);
          }
        );
        scannerRef.current = scanner;
        setIsScanning(true);
      } catch (err) {
        setError((err as Error).message);
        if (onError) onError(err as Error);
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current) {
        barcodeService.stopScanning(scannerRef.current);
      }
    };
  }, [hasCamera, onScan, onError]);

  const stopScanning = () => {
    if (scannerRef.current) {
      barcodeService.stopScanning(scannerRef.current);
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  if (hasCamera === null) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Checking camera availability...</p>
      </div>
    );
  }

  if (hasCamera === false) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
          Camera not available. Please use manual entry.
        </p>
        {onClose && (
          <button
            onClick={onClose}
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
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <video
        ref={videoRef}
        style={{
          width: '100%',
          borderRadius: '12px',
          backgroundColor: '#000'
        }}
        playsInline
      />
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '8px', marginTop: '1rem' }}>
          <p style={{ color: '#ef4444', margin: 0 }}>Error: {error}</p>
        </div>
      )}
      {isScanning && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ color: '#6b7280' }}>Point your camera at a barcode</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button
          onClick={stopScanning}
          style={{
            flex: 1,
            padding: '0.75rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Stop Scanning
        </button>
        {onClose && (
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#002B4D',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;

