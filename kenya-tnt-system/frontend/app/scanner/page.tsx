'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { ScanResults } from '@/components/ScanResults';
import { parseGS1Barcode, GS1ParsedData } from '@/lib/utils/gs1-parser';
import { ArrowLeft } from 'lucide-react';

export default function BarcodeScannerPage() {
  const [scanResult, setScanResult] = useState<GS1ParsedData | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleScanSuccess = async (decodedText: string) => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      console.log('Scanned barcode:', decodedText);
      
      // Parse the scanned barcode using backend API
      const parsedData = await parseGS1Barcode(decodedText);

      console.log('Parsed result:', parsedData);

      if (parsedData) {
        setScanResult(parsedData);
        setShowScanner(false);
      } else {
        setErrorMessage(`Unable to parse barcode. Scanned data: ${decodedText.substring(0, 100)}...`);
      }
    } catch (error: any) {
      console.error('Error processing scan:', error);
      setErrorMessage(`Error: ${error.message || 'Failed to process barcode'}. Data: ${decodedText.substring(0, 50)}...`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setShowScanner(true);
    setErrorMessage('');
    setManualInput('');
    setShowManualInput(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      await handleScanSuccess(manualInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header with Brand Logos */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          {/* Partner Logos */}
          <div className="flex justify-center items-center gap-6 mb-4">
            <div className="bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow">
              <Image
                src="/dha.jpeg"
                alt="Digital Health Agency"
                width={150}
                height={60}
                className="w-auto h-12 object-contain"
                priority
              />
            </div>
            
            <div className="text-2xl text-gray-300">×</div>
            
            <div className="bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition-shadow">
              <Image
                src="/tc.jpeg"
                alt="TaifaCare"
                width={150}
                height={60}
                className="w-auto h-12 object-contain"
                priority
              />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              GS1 Barcode Scanner
            </h1>
            <p className="text-sm text-gray-600 mt-1">Pharmaceutical Supply Chain Tracking</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-bold text-lg mb-2">About GS1 Barcodes</p>
              <p className="mb-3 text-white/90">
                This tool scans and parses GS1-compliant barcodes used in pharmaceutical supply chains.
                Supported formats include:
              </p>
              <ul className="space-y-2 text-white/90">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300">•</span>
                  <span><strong>GS1 Data Matrix</strong> - 2D barcode with product info, serial number, batch, and expiry date</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300">•</span>
                  <span><strong>GTIN</strong> - Global Trade Item Number (8-14 digits)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300">•</span>
                  <span><strong>SSCC</strong> - Serial Shipping Container Code (18 digits)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300">•</span>
                  <span><strong>GS1 Digital Link</strong> - URL format (e.g., https://id.gs1.org/01/...)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scanner or Results */}
        {showScanner ? (
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-green-500 rounded-full"></span>
              Scan Barcode
            </h2>
            
            {errorMessage && (
              <div className="mb-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg shadow-lg">
                <p className="font-bold">⚠️ Error</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            )}

            {!showManualInput ? (
              <>
                <BarcodeScanner
                  onScanSuccess={handleScanSuccess}
                  onScanError={setErrorMessage}
                  disabled={isProcessing}
                />

                {isProcessing && (
                  <div className="mt-4 flex items-center justify-center gap-3 text-blue-600">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Processing barcode...</span>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                  >
                    ✏️ Or enter barcode manually
                  </button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="manual-input" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Barcode Data
                    </label>
                    <textarea
                      id="manual-input"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Paste or type barcode data here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      rows={4}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isProcessing || !manualInput.trim()}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-bold shadow-lg"
                    >
                      {isProcessing ? '⏳ Processing...' : '🔍 Parse Barcode'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualInput(false);
                        setManualInput('');
                      }}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      📷 Use Camera
                    </button>
                  </div>
                </form>

                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg text-sm">
                  <p className="font-bold text-gray-900 mb-2">💡 Test Examples:</p>
                  <div className="space-y-2 text-gray-700 font-mono text-xs">
                    <div>
                      <p className="font-semibold">Traditional Format:</p>
                      <code className="bg-white px-2 py-1 rounded block mt-1">
                        (01)12345678901234(21)ABC123(10)LOT001(17)251231
                      </code>
                    </div>
                    <div>
                      <p className="font-semibold">Plain GTIN:</p>
                      <code className="bg-white px-2 py-1 rounded block mt-1">
                        12345678901234
                      </code>
                    </div>
                    <div>
                      <p className="font-semibold">Plain SSCC:</p>
                      <code className="bg-white px-2 py-1 rounded block mt-1">
                        123456789012345678
                      </code>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            {scanResult && <ScanResults data={scanResult} onScanAgain={handleScanAgain} />}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-lg p-6 shadow-md text-center space-y-2">
          <p className="text-sm text-gray-700 font-medium">
            🌍 GS1 standards are used globally for pharmaceutical supply chain tracking and authentication.
          </p>
          <p className="text-sm text-gray-600">
            🔒 This is a public utility tool - no data is stored or transmitted beyond parsing.
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Powered by Digital Health Agency & TaifaCare
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
