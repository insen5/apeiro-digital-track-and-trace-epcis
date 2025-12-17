'use client';

import { GS1ParsedData, formatGTIN, formatSSCC, formatDate, getFieldLabel } from '@/lib/utils/gs1-parser';

interface ScanResultsProps {
  data: GS1ParsedData;
  onScanAgain: () => void;
}

export function ScanResults({ data, onScanAgain }: ScanResultsProps) {
  const displayFields: Array<keyof GS1ParsedData> = [
    'code_type',
    'format',
    'gtin',
    'sscc',
    'serial_number',
    'batch_number',
    'expiry_date',
    'production_date',
    'best_before_date',
    'packaging_date',
    'net_weight',
    'trade_item_count',
    'gdti',
    'gsin',
    'gln_ship_to',
    'gln_bill_to',
    'gln_purchase_from',
    'gln_ship_for',
    'gln_physical',
    'gln_invoicing',
  ];

  const formatValue = (field: keyof GS1ParsedData, value: any): string => {
    if (field === 'gtin' && value) {
      return formatGTIN(value);
    }
    if (field === 'sscc' && value) {
      return formatSSCC(value);
    }
    if ((field === 'expiry_date' || field === 'production_date' || field === 'best_before_date' || field === 'packaging_date') && value) {
      return formatDate(value);
    }
    return value?.toString() || '';
  };

  const getCodeTypeColor = (codeType: string | undefined): string => {
    switch (codeType) {
      case 'GTIN':
        return 'bg-blue-100 text-blue-800';
      case 'SSCC':
        return 'bg-green-100 text-green-800';
      case 'GDTI':
        return 'bg-purple-100 text-purple-800';
      case 'GSIN':
        return 'bg-orange-100 text-orange-800';
      case 'GLN':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-green-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-green-900 font-semibold">Barcode Scanned Successfully!</h3>
            <p className="text-green-700 text-sm mt-1">
              {data.code_type && (
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCodeTypeColor(data.code_type)}`}>
                  {data.code_type}
                </span>
              )}
              {data.format && <span className="ml-2 text-xs">Format: {data.format}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Parsed Data */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Parsed GS1 Data</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {displayFields.map((field) => {
            const value = data[field];
            if (!value) return null;

            return (
              <div key={field} className="px-4 py-3 flex justify-between items-start hover:bg-gray-50">
                <span className="font-medium text-gray-700 text-sm">{getFieldLabel(field)}:</span>
                <span className="text-gray-900 text-sm text-right ml-4 font-mono">
                  {formatValue(field, value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Warnings */}
      {data.validation_warnings && data.validation_warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-yellow-900 font-semibold mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Validation Warnings
          </h4>
          <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
            {data.validation_warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw Data */}
      <details className="bg-gray-50 border border-gray-200 rounded-lg">
        <summary className="px-4 py-3 cursor-pointer hover:bg-gray-100 font-medium text-gray-700 text-sm">
          Show Raw Barcode Data
        </summary>
        <div className="px-4 py-3 border-t border-gray-200">
          <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto font-mono">
            {data.raw_data}
          </pre>
        </div>
      </details>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onScanAgain}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Scan Another Barcode
        </button>
      </div>
    </div>
  );
}
