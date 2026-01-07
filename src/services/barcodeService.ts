import QrScanner from 'qr-scanner';
import { logServiceError } from './baseService';

export interface BarcodeScanResult {
  data: string;
  format?: string;
}

export const barcodeService = {
  // Check if camera is available
  async hasCamera(): Promise<boolean> {
    return await QrScanner.hasCamera();
  },

  // Start barcode scanning
  async scanBarcode(
    videoElement: HTMLVideoElement,
    onResult: (result: BarcodeScanResult) => void,
    onError?: (error: Error) => void
  ): Promise<QrScanner> {
    const qrScanner = new QrScanner(
      videoElement,
      (result) => {
        onResult({
          data: result.data
        });
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true
      }
    );

    try {
      await qrScanner.start();
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        logServiceError('scanBarcode', 'barcode', error);
      }
    }

    return qrScanner;
  },

  // Stop scanning
  stopScanning(scanner: QrScanner): void {
    scanner.stop();
    scanner.destroy();
  }
};

