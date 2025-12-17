'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  disabled?: boolean;
}

export function BarcodeScanner({ onScanSuccess, onScanError, disabled = false }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = 'barcode-scanner-view';

  useEffect(() => {
    // Check camera permission status on mount
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((result) => {
          setCameraPermission(result.state as 'granted' | 'denied' | 'prompt');
        })
        .catch(() => {
          setCameraPermission('prompt');
        });
    }

    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Small delay to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const html5QrCode = new Html5Qrcode(scannerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 500, height: 500 }, // Larger scan area
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback (silent - scanning continuously)
        }
      );

      setCameraPermission('granted');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to access camera. Please ensure camera permissions are granted.';
      setError(errorMsg);
      setIsScanning(false);
      setCameraPermission('denied');
      if (onScanError) onScanError(errorMsg);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  return (
    <div className="relative w-full">
      {/* Scanner View */}
      <div
        id={scannerElementId}
        className={`w-full ${isScanning ? 'block' : 'hidden'}`}
        style={{ minHeight: '600px' }}
      />

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-semibold">Camera Error</p>
          <p className="text-sm">{error}</p>
          {cameraPermission === 'denied' && (
            <p className="text-xs mt-2">
              Please enable camera permissions in your browser settings and reload the page.
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 justify-center mt-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            disabled={disabled}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopScanning}
            disabled={disabled}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              />
            </svg>
            Stop Camera
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="font-semibold text-blue-900 mb-2">Scanning Instructions:</p>
        <ul className="text-blue-800 space-y-1 list-disc list-inside">
          <li>Position the barcode within the blue scanning box</li>
          <li>Hold steady - scanning is automatic</li>
          <li>Works with GS1 Data Matrix, QR codes, and 1D barcodes</li>
          <li>Ensure good lighting for best results</li>
        </ul>
      </div>
    </div>
  );
}
