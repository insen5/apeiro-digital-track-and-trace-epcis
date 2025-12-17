"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { Printer, QrCode } from "lucide-react";
import SSCCBarcode from "./SSCCBarcode";

interface SSCCAssignmentProps {
  currentSSCC?: string;
  onAssign: (sscc?: string) => Promise<any>;
  label: string; // e.g., "Case" or "Package"
  itemId: number;
}

export default function SSCCAssignment({
  currentSSCC,
  onAssign,
  label,
  itemId,
}: SSCCAssignmentProps) {
  const [loading, setLoading] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [customSSCC, setCustomSSCC] = useState("");

  const handleAssign = async (sscc?: string) => {
    try {
      setLoading(true);
      await onAssign(sscc);
      showToast.success(`${label} SSCC assigned successfully!`);
      setCustomSSCC("");
    } catch (error: any) {
      showToast.error(error.message || `Failed to assign SSCC to ${label}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = () => {
    handleAssign(); // No SSCC = auto-generate
  };

  const handleCustomAssign = () => {
    if (!customSSCC.trim()) {
      showToast.error("Please enter an SSCC");
      return;
    }
    if (customSSCC.length !== 18) {
      showToast.error("SSCC must be exactly 18 digits");
      return;
    }
    handleAssign(customSSCC);
  };

  const handlePrint = () => {
    if (!currentSSCC) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>SSCC Barcode - ${currentSSCC}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                font-family: Arial, sans-serif;
              }
              .barcode-container {
                text-align: center;
                padding: 20px;
                border: 2px solid #000;
                border-radius: 8px;
              }
              .sscc-text {
                font-size: 24px;
                font-weight: bold;
                margin-top: 10px;
                letter-spacing: 2px;
              }
              .label-text {
                font-size: 18px;
                margin-bottom: 10px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="label-text">${label} SSCC</div>
              <div id="barcode"></div>
              <div class="sscc-text">${currentSSCC}</div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <script>
              JsBarcode("#barcode", "${currentSSCC}", {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: false
              });
              window.onload = () => window.print();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (currentSSCC) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">SSCC:</span>
          <span className="text-sm font-mono font-bold text-blue-600">
            {currentSSCC}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBarcode(!showBarcode)}
            className="flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            {showBarcode ? "Hide" : "Show"} Barcode
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
        {showBarcode && (
          <div className="p-4 bg-white border rounded-lg">
            <SSCCBarcode sscc={currentSSCC} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-gray-50 border rounded-lg">
      <div className="text-sm font-medium text-gray-700">
        Assign SSCC to {label} #{itemId}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleAutoAssign}
          disabled={loading}
          size="sm"
          className="w-full"
        >
          {loading ? "Assigning..." : "Auto-Generate SSCC"}
        </Button>
        <div className="text-xs text-gray-500 text-center">OR</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customSSCC}
            onChange={(e) => setCustomSSCC(e.target.value)}
            placeholder="Enter 18-digit SSCC"
            maxLength={18}
            className="flex-1 px-3 py-2 border rounded-md text-sm font-mono"
          />
          <Button
            onClick={handleCustomAssign}
            disabled={loading || !customSSCC.trim()}
            size="sm"
            variant="outline"
          >
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}

