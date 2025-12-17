/**
 * GS1 Barcode Parser Utility (Frontend)
 * Client-side parsing with fallback to backend API
 */

export interface GS1ParsedData {
  gtin?: string;
  sscc?: string;
  serial_number?: string;
  expiry_date?: string;
  batch_number?: string;
  production_date?: string;
  best_before_date?: string;
  packaging_date?: string;
  net_weight?: string;
  trade_item_count?: string;
  gdti?: string;
  gsin?: string;
  gln?: string;
  gln_ship_to?: string;
  gln_bill_to?: string;
  gln_purchase_from?: string;
  gln_ship_for?: string;
  gln_physical?: string;
  gln_invoicing?: string;
  raw_data: string;
  code_type?: 'GTIN' | 'SSCC' | 'GDTI' | 'GSIN' | 'GLN';
  format?: 'Traditional' | 'Digital Link' | 'Plain';
  validation_warnings?: string[];
}

/**
 * Parse GS1 barcode using backend API
 */
export async function parseGS1Barcode(barcodeData: string): Promise<GS1ParsedData | null> {
  try {
    // Backend uses /api prefix (see main.ts line 29)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const endpoint = `${apiUrl}/api/public/barcode-scanner/parse`;
    
    console.log('Calling API:', endpoint);
    console.log('Barcode data:', barcodeData);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode_data: barcodeData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('API response:', result);
    
    if (result.success && result.data) {
      return result.data;
    }

    // Even if not successful, return data if available (for debugging)
    if (result.data) {
      console.warn('Barcode parsed but validation failed:', result.error);
      return result.data;
    }

    console.error('API returned error:', result.error);
    throw new Error(result.error || 'Failed to parse barcode');
  } catch (error) {
    console.error('Error parsing barcode:', error);
    throw error;
  }
}

/**
 * Format GTIN for display
 */
export function formatGTIN(gtin: string): string {
  if (!gtin || gtin.length !== 14) return gtin;
  return `${gtin.substring(0, 1)}-${gtin.substring(1, 5)}-${gtin.substring(5, 9)}-${gtin.substring(9, 13)}-${gtin.substring(13)}`;
}

/**
 * Format SSCC for display
 */
export function formatSSCC(sscc: string): string {
  if (!sscc || sscc.length !== 18) return sscc;
  return `${sscc.slice(0, 1)}-${sscc.slice(1, 10)}-${sscc.slice(10, 17)}-${sscc.slice(17)}`;
}

/**
 * Format date from YYYY-MM-DD to readable format
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get field label for display
 */
export function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    gtin: 'GTIN (Product ID)',
    sscc: 'SSCC (Shipping Container)',
    serial_number: 'Serial Number',
    batch_number: 'Batch/Lot Number',
    expiry_date: 'Expiry Date',
    production_date: 'Production Date',
    best_before_date: 'Best Before Date',
    packaging_date: 'Packaging Date',
    net_weight: 'Net Weight',
    trade_item_count: 'Item Count',
    gdti: 'GDTI (Document ID)',
    gsin: 'GSIN (Shipment ID)',
    gln: 'GLN (Location)',
    gln_ship_to: 'GLN Ship To',
    gln_bill_to: 'GLN Bill To',
    gln_purchase_from: 'GLN Purchase From',
    gln_ship_for: 'GLN Ship For',
    gln_physical: 'GLN Physical Location',
    gln_invoicing: 'GLN Invoicing Party',
    code_type: 'Code Type',
    format: 'Format',
  };
  
  return labels[field] || field;
}
