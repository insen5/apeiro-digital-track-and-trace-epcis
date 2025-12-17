# GS1 Barcode Scanner - Quick Start Guide

## ✅ Implementation Status: COMPLETE

The GS1 barcode scanner has been successfully integrated into the Kenya Track and Trace system!

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd kenya-tnt-system/core-monolith
npm install  # If not already done
npm run start:dev
```

Backend API will be available at: `http://localhost:3000`

### 2. Start the Frontend

```bash
cd kenya-tnt-system/frontend
npm install  # Will include html5-qrcode
npm run dev
```

Frontend will be available at: `http://localhost:3002`

### 3. Access the Scanner

Open your browser to: **`http://localhost:3002/scanner`**

## 📱 How to Use

1. Click **"Start Camera"** button
2. Grant camera permissions when prompted
3. Point your camera at a GS1 barcode
4. Barcode will be scanned and parsed automatically
5. View detailed results including all parsed fields
6. Click **"Scan Another Barcode"** to continue

## 🧪 Test It Out

### Using the UI
Visit `/scanner` and scan these test barcodes:

**Traditional Format (print or display on screen):**
```
(01)12345678901234(21)ABC123(10)LOT001(17)251231
```

**Plain GTIN:**
```
12345678901234
```

**Plain SSCC:**
```
123456789012345678
```

### Using the API Directly

```bash
# Parse a barcode
curl -X POST http://localhost:3000/public/barcode-scanner/parse \
  -H "Content-Type: application/json" \
  -d '{
    "barcode_data": "(01)12345678901234(21)ABC123(10)LOT001(17)251231"
  }'

# Validate an SSCC
curl -X POST http://localhost:3000/public/barcode-scanner/validate-sscc \
  -H "Content-Type: application/json" \
  -d '{"sscc": "123456789012345678"}'
```

## 📦 What's Included

### Backend
- ✅ GS1 Parser Service with full format support
- ✅ Public API endpoints (no auth required)
- ✅ Support for 18 Application Identifiers
- ✅ SSCC validation with check digit
- ✅ Complete error handling

### Frontend
- ✅ Camera-based barcode scanner
- ✅ Real-time scanning and parsing
- ✅ Beautiful results display
- ✅ Mobile-friendly responsive design
- ✅ Public access at `/scanner`

## 🎯 Supported Barcodes

| Type | Description | Example |
|------|-------------|---------|
| **GS1 Data Matrix** | 2D barcode with product info | `(01)12345...(21)ABC...` |
| **GTIN** | Product identifier | `12345678901234` |
| **SSCC** | Shipping container | `123456789012345678` |
| **Digital Link** | URL format | `https://id.gs1.org/01/...` |

## 📊 Parsed Fields

The scanner extracts:
- ✅ GTIN (Product ID)
- ✅ SSCC (Shipping Container)
- ✅ Serial Number
- ✅ Batch/Lot Number
- ✅ Expiry Date
- ✅ Production Date
- ✅ Best Before Date
- ✅ Packaging Date
- ✅ Net Weight
- ✅ Trade Item Count
- ✅ GDTI, GSIN, GLN variants

## 🔧 Troubleshooting

### Camera Not Working?
1. Grant camera permissions in browser
2. Use HTTPS or localhost
3. Check if another app is using camera
4. Try a different browser (Chrome recommended)

### Barcode Not Scanning?
1. Ensure good lighting
2. Hold camera steady
3. Position barcode in the blue box
4. Try moving closer/farther
5. Ensure barcode is not damaged

### API Errors?
1. Check backend is running on port 3000
2. Check CORS configuration
3. Verify barcode data format
4. Check backend logs for details

## 📚 Documentation

For complete technical documentation, see:
- **BARCODE_SCANNER_README.md** - Full technical details
- **BARCODE_SCANNER_IMPLEMENTATION.md** - Implementation summary

## 🎉 Features

- **No Authentication** - Public access for anyone
- **No Data Storage** - Privacy-first, pure parsing utility
- **Mobile-First** - Works on phones, tablets, desktops
- **Real-Time** - Instant barcode parsing
- **GS1 Compliant** - Follows international standards
- **Type-Safe** - Full TypeScript support

## 💡 Use Cases

Perfect for:
- ✅ Verifying product authenticity
- ✅ Checking expiry dates
- ✅ Tracking shipments
- ✅ Inventory management
- ✅ Supply chain transparency
- ✅ Training and education

## 🔒 Privacy & Security

- No user authentication required
- No data stored or tracked
- No location services
- Public API endpoint
- Camera access only with user permission

---

## 🎊 Ready to Use!

The barcode scanner is now fully functional and ready for testing!

**URL**: `http://localhost:3002/scanner`

**API**: `http://localhost:3000/public/barcode-scanner/*`

Enjoy scanning! 📱🔍✨
