# Barcode Scanner Debugging Guide

## Issue: "Invalid barcode, try again" errors

The scanner has been updated with better error handling and debugging. Here's what changed:

### Changes Made

1. **Added Console Logging**
   - Backend now logs barcode length and content
   - Frontend logs API calls and responses
   - Both log the parsed data structure

2. **More Lenient Validation**
   - Scanner now accepts barcodes with ANY valid GS1 identifier
   - Returns raw data even on validation failure (for debugging)
   - Better error messages showing what was scanned

3. **Manual Input Option**
   - Click "Or enter barcode manually" to test without camera
   - Includes test examples you can copy/paste
   - Better for debugging parsing issues

### How to Debug

#### 1. Check Browser Console (F12)

When scanning, you should see:
```
Scanned barcode: <your barcode data>
Calling API: http://localhost:3000/public/barcode-scanner/parse
Barcode data: <your barcode data>
API response: { success: true/false, data: {...} }
Parsed result: {...}
```

#### 2. Check Backend Logs

In the terminal running the backend, you should see:
```
[BarcodeScannerController] Parsing barcode (length: X): <barcode>...
[BarcodeScannerController] Parsed data: {...}
[BarcodeScannerController] Successfully parsed GTIN barcode (format: Traditional)
```

#### 3. Test with Manual Input

1. Go to `/scanner`
2. Click "Or enter barcode manually"
3. Copy/paste one of these test barcodes:

**Traditional Format:**
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

4. Click "Parse Barcode"
5. Check browser console for API response

### Common Issues & Solutions

#### Issue: Camera scans but says "Invalid"

**Check:**
1. Is the barcode actually GS1 format?
2. Check browser console - does it show the scanned data?
3. Try manual input with the same data

**Solution:**
- If manual input works, it's a camera issue
- If manual input fails, the barcode isn't GS1-compliant

#### Issue: API returns error

**Check:**
1. Is backend running? (`npm run start:dev` in core-monolith)
2. Is it on port 3000? (default)
3. Check browser Network tab (F12 → Network)

**Solution:**
```bash
# Backend
cd kenya-tnt-system/core-monolith
npm run start:dev

# Frontend
cd kenya-tnt-system/frontend
npm run dev
```

#### Issue: Camera not working

**Check:**
1. HTTPS or localhost?
2. Camera permissions granted?
3. Camera in use by another app?

**Solution:**
- Use `http://localhost:3002` (not IP address)
- Check browser settings → Privacy → Camera
- Close other apps using camera

### Testing the Parser Directly

Test the backend API without the UI:

```bash
# Test with traditional format
curl -X POST http://localhost:3000/public/barcode-scanner/parse \
  -H "Content-Type: application/json" \
  -d '{"barcode_data": "(01)12345678901234(21)ABC123(10)LOT001(17)251231"}'

# Test with plain GTIN
curl -X POST http://localhost:3000/public/barcode-scanner/parse \
  -H "Content-Type: application/json" \
  -d '{"barcode_data": "12345678901234"}'

# Test with plain SSCC
curl -X POST http://localhost:3000/public/barcode-scanner/parse \
  -H "Content-Type: application/json" \
  -d '{"barcode_data": "123456789012345678"}'
```

Expected response:
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

### What to Share for Support

If still having issues, share:

1. **Browser Console Output** (F12 → Console)
2. **Backend Terminal Logs** (where you ran `npm run start:dev`)
3. **Barcode Data** (what you're trying to scan)
4. **Manual Input Result** (does it work when typing?)

### Next Steps

1. **Start backend**: `cd kenya-tnt-system/core-monolith && npm run start:dev`
2. **Start frontend**: `cd kenya-tnt-system/frontend && npm run dev`
3. **Open scanner**: `http://localhost:3002/scanner`
4. **Try manual input** with test examples
5. **Check console logs** in both browser and terminal

The updated scanner is much more verbose and will show exactly what's happening at each step!
