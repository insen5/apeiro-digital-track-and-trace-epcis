import React, { useState, useEffect } from "react";
import JsBarcode from "jsbarcode";

interface SSCCBarcodeProps {
  sscc: string;
}

const SSCCBarcode: React.FC<SSCCBarcodeProps> = ({ sscc }) => {
  const [barcodeSvg, setBarcodeSvg] = useState<string>("");

  useEffect(() => {
    generateBarcode(sscc);
  }, [sscc]);

  const generateBarcode = (sscc: string): void => {
    if (!sscc?.trim()) {
      setBarcodeSvg("");
      return;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    try {
      JsBarcode(svg, sscc, {
        format: "CODE128",
        lineColor: "#000000",
        height: 90, // fixed height
        displayValue: true,
        text: `${sscc}`,
        textMargin: 5,
        fontSize: 16, // fixed font size
        margin: 10,
      });

      const serialized = new XMLSerializer().serializeToString(svg);
      setBarcodeSvg(serialized);
    } catch (error) {
      console.error("Error generating barcode:", error);
      setBarcodeSvg("");
    }
  };

  return (
    <div className="inline-block p-2">
      {barcodeSvg ? (
        <div
          className="barcode-container"
          style={{
            width: "260px",
            height: "90px",
            flexShrink: 0,
            aspectRatio: "275.84/103.00",
            display: "flex",
            alignItems: "center",
          }}
          dangerouslySetInnerHTML={{ __html: barcodeSvg }}
        />
      ) : (
        <div className="flex justify-center items-center h-24 w-full bg-gray-50 rounded text-gray-400 text-sm">
          {sscc ? "Invalid SSCC format" : "No SSCC provided"}
        </div>
      )}
    </div>
  );
};

export default SSCCBarcode;
