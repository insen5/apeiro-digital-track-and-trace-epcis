# GS1 Barcode Scanner Module

A public barcode scanning utility integrated into the Kenya Track and Trace system, allowing anyone to scan and parse GS1-compliant barcodes used in pharmaceutical supply chains.

## Features

### Barcode Support
- **GS1 Data Matrix** - Traditional format with parentheses `(01)12345678901234(21)ABC123...`
- **GS1 FNC1 Format** - With special separators (GS, RS, US characters)
- **GS1 Digital Link** - URL format `https://id.gs1.org/01/12345678901234/21/ABC123`
- **Plain GTIN** - 8, 12, 13, or 14 digit product identifiers
- **Plain SSCC** - 18 digit shipping container codes

### Supported Application Identifiers (AI)
| AI | Description | Example |
|----|-------------|---------|
| 00 | SSCC (Shipping Container) | 123456789012345678 |
| 01 | GTIN (Product ID) | 12345678901234 |
| 10 | Batch/Lot Number | LOT12345 |
| 11 | Production Date | 241231 (2024-12-31) |
| 13 | Packaging Date | 241225 |
| 15 | Best Before Date | 251231 |
| 17 | Expiry Date | 251201 |
| 21 | Serial Number | SN123456 |
| 37 | Trade Item Count | 24 |
| 253 | GDTI (Document ID) | 1234567890123DOC |
| 310n | Net Weight (kg) | 001500 (1.5 kg) |
| 402 | GSIN (Shipment ID) | 12345678901234567 |
| 410-415 | GLN variants | 1234567890123 |

## Architecture

### Backend (NestJS)

**Location**: `kenya-tnt-system/core-monolith/src/`

#### GS1 Parser Service
- **File**: `shared/gs1/gs1-parser.service.ts`
- **Purpose**: Core GS1 barcode parsing logic
- **Features**:
  - Parses all major GS1 formats
  - Validates field lengths according to GS1 spec
  - Formats dates from YYMMDD to YYYY-MM-DD
  - Validates SSCC check digits
  - Provides formatted output for display

#### Barcode Scanner Controller
- **File**: `modules/shared/barcode-scanner/barcode-scanner.controller.ts`
- **Endpoints**:
  - `POST /public/barcode-scanner/parse` - Parse any GS1 barcode
  - `POST /public/barcode-scanner/validate-sscc` - Validate SSCC check digit
- **Access**: Public (no authentication required)

#### Module Registration
- **File**: `app.module.ts`
- The `BarcodeScannerModule` is registered in the main application module

### Frontend (Next.js)

**Location**: `kenya-tnt-system/frontend/`

#### Components

**1. BarcodeScanner Component**
- **File**: `components/BarcodeScanner.tsx`
- **Library**: html5-qrcode
- **Features**:
  - Camera access with permission handling
  - Continuous scanning mode
  - Error handling and user feedback
  - Responsive design for mobile and desktop

**2. ScanResults Component**
- **File**: `components/ScanResults.tsx`
- **Features**:
  - Formatted display of all parsed fields
  - Color-coded by barcode type
  - Validation warnings display
  - Raw data viewer
  - Formatted GTIN and SSCC

#### Utilities
- **File**: `lib/utils/gs1-parser.ts`
- **Functions**:
  - `parseGS1Barcode()` - API client for barcode parsing
  - `formatGTIN()` - Format GTIN for display
  - `formatSSCC()` - Format SSCC for display
  - `formatDate()` - Date formatting
  - `getFieldLabel()` - Human-readable field labels

#### Public Scanner Page
- **URL**: `/scanner`
- **File**: `app/scanner/page.tsx`
- **Access**: Public (no authentication)
- **Features**:
  - Camera-based scanning
  - Real-time parsing
  - Detailed results display
  - No data storage or tracking

## Installation

### Backend Dependencies
Already included in the project - no additional installations needed.

### Frontend Dependencies
```bash
cd kenya-tnt-system/frontend
npm install html5-qrcode
```

## Usage

### Starting the Application

**Backend:**
```bash
cd kenya-tnt-system/core-monolith
npm run start:dev
```

**Frontend:**
```bash
cd kenya-tnt-system/frontend
npm run dev
```

### Accessing the Scanner

1. Open browser to `http://localhost:3002/scanner`
2. Grant camera permissions when prompted
3. Click "Start Camera"
4. Position barcode in the scanning area
5. View parsed results instantly

### API Usage

**Parse Barcode Endpoint:**
```bash
curl -X POST http://localhost:3000/public/barcode-scanner/parse \
  -H "Content-Type: application/json" \
  -d '{
    "barcode_data": "(01)12345678901234(21)ABC123(10)LOT001(17)251231"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gtin": "12345678901234",
    "serial_number": "ABC123",
    "batch_number": "LOT001",
    "expiry_date": "2025-12-31",
    "code_type": "GTIN",
    "format": "Traditional",
    "raw_data": "(01)12345678901234(21)ABC123(10)LOT001(17)251231"
  }
}
```

## Testing

### Test Barcodes

**Traditional Format:**
```
(01)12345678901234(21)ABC123(10)LOT001(17)251231
```

**Digital Link:**
```
https://id.gs1.org/01/12345678901234/21/ABC123?10=LOT001&17=251231
```

**Plain GTIN:**
```
12345678901234
```

**Plain SSCC:**
```
123456789012345678
```

### Browser Compatibility

| Browser | Version | Camera | Scanning |
|---------|---------|--------|----------|
| Chrome  | 90+     | ✅     | ✅       |
| Edge    | 90+     | ✅     | ✅       |
| Safari  | 14+     | ✅     | ✅       |
| Firefox | 88+     | ✅     | ✅       |

**Note**: HTTPS required for camera access (or localhost for development)

## Implementation Notes

### Design Decisions

1. **No Data Storage**: Scanner is a pure utility - no scan data is stored
2. **No Authentication**: Public endpoint for maximum accessibility
3. **No Location Tracking**: Privacy-first approach
4. **No Offline Queue**: Real-time parsing only
5. **Backend Parsing**: Centralized logic for consistency

### Security Considerations

- Public API endpoint (no sensitive data exposure)
- Rate limiting recommended for production
- Input validation on all barcode data
- CORS configured for frontend access

### Database Compliance

Following the project's snake_case naming convention:
- All entity properties use snake_case (e.g., `serial_number`, `expiry_date`)
- Matches PostgreSQL column naming standards
- Consistent with existing EPCIS entities

## Integration with Existing System

### PPB Module Integration
While this is a standalone scanner, parsed data can be used with:
- **PPB Consignment Import**: Scan SSCCs to verify shipments
- **Batch Tracking**: Verify batch numbers and expiry dates
- **Product Verification**: Look up GTINs in PPB product catalog
- **Journey Tracking**: Input for EPCIS event creation

### Future Enhancements
- Product lookup integration (GS1 Kenya API)
- Batch verification against consignment data
- EPCIS event creation from scans
- Export scan results to CSV/PDF
- Multi-language support (Swahili, French)
- Bulk scanning mode

## Troubleshooting

### Camera Not Working
1. Check browser permissions (Settings → Privacy → Camera)
2. Ensure HTTPS or localhost
3. Try different browser
4. Check if camera is in use by another app

### Barcode Not Scanning
1. Ensure good lighting
2. Hold steady - avoid shaking
3. Try different distance from camera
4. Clean camera lens
5. Ensure barcode is not damaged or faded

### Parsing Errors
1. Check barcode format (GS1-compliant)
2. Verify barcode is not truncated
3. Try manual entry if scanning fails
4. Check backend logs for parsing details

## API Reference

### POST /public/barcode-scanner/parse

Parse a GS1-compliant barcode.

**Request Body:**
```typescript
{
  barcode_data: string; // Required: barcode content
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: GS1ParsedData;
  error?: string;
}
```

### POST /public/barcode-scanner/validate-sscc

Validate an SSCC check digit.

**Request Body:**
```typescript
{
  sscc: string; // Required: 18-digit SSCC
}
```

**Response:**
```typescript
{
  valid: boolean;
  sscc: string;
  formatted?: string; // If valid
}
```

## Contributing

When extending the scanner:
1. Follow snake_case naming in backend
2. Update supported AIs list in documentation
3. Add test cases for new formats
4. Maintain backward compatibility
5. Update type definitions in both frontend and backend

## References

- [GS1 General Specifications](https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications)
- [EPCIS Standard](https://www.gs1.org/standards/epcis)
- [html5-qrcode Library](https://github.com/mebjas/html5-qrcode)
- [GS1 Digital Link](https://www.gs1.org/standards/gs1-digital-link)

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Maintained By**: Kenya Track and Trace Development Team
