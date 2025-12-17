// GS1 DTOs

export interface GenerateSSCCDto {
  companyPrefix?: string; // Optional: GS1 company prefix (if available)
}

export interface GenerateSGTINDto {
  gtin: string; // Global Trade Item Number (14 digits)
  serialNumber: string; // Serial number
  companyPrefix?: string; // Optional: GS1 company prefix
}

export interface GenerateBatchNumberDto {
  productId: number;
  userId: string;
  prefix?: string; // Optional: Custom prefix
}

export interface ValidateGS1IdentifierDto {
  identifier: string;
  type: 'SSCC' | 'SGTIN' | 'GTIN' | 'BATCH' | 'GLN';
}

export interface GenerateBarcodeDto {
  data: string; // EPC or identifier
  format: 'code128' | 'datamatrix' | 'qrcode';
  width?: number;
  height?: number;
}

// GCP (Global Company Prefix) DTOs

export interface ValidateGCPDto {
  prefix: string; // Company prefix to validate (6-12 digits)
}

export interface LookupGCPDto {
  prefix: string; // Company prefix to lookup
  forceRefresh?: boolean; // If true, bypass cache and refresh from database
}

export interface GCPLookupResult {
  prefix: string;
  companyName: string;
  entityId: string;
  entityType: string; // 'supplier', 'manufacturer', 'logistics_provider', etc.
  gln?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: string;
  source: 'supplier' | 'logistics_provider';
}

export interface ExtractGCPFromIdentifierDto {
  identifier: string; // GTIN, GLN, SSCC, or SGTIN (EPC URI format)
  prefixLength: number; // Expected prefix length (6-12 digits)
}

