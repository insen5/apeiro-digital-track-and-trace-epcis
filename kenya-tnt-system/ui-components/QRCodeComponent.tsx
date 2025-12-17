"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface QRCodeComponentProps {
  value: string;
  size?: number;
  margin?: number;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  darkColor?: string;
  lightColor?: string;
  includeInput?: boolean;
  className?: string;
  type?: "canvas" | "svg";
  downloadFileName?: string;
}

export const QRCodeComponent: React.FC<QRCodeComponentProps> = ({
  value = "1-8373123987-2",
  size = 128,
  margin = 2,
  errorCorrectionLevel = "M",
  darkColor = "#000000",
  lightColor = "#ffffff",
  includeInput = false,
  className = "",
  type = "canvas",
  downloadFileName = "qrcode",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      setIsGenerating(true);
      try {
        const options = {
          width: size,
          margin,
          color: {
            dark: darkColor,
            light: lightColor,
          },
          errorCorrectionLevel,
        };

        if (type === "canvas" && canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, inputValue, options);
        } else if (type === "svg" && svgRef.current) {
          const svgString = await QRCode.toString(inputValue, {
            ...options,
            type: "svg",
          });
          svgRef.current.innerHTML = svgString;
        }
      } catch (err) {
        console.error("Failed to generate QR code", err);
      } finally {
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [
    inputValue,
    size,
    margin,
    darkColor,
    lightColor,
    errorCorrectionLevel,
    type,
  ]);

  const handleDownload = () => {
    if (type === "canvas" && canvasRef.current) {
      const link = document.createElement("a");
      link.download = `${downloadFileName}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    } else if (type === "svg" && svgRef.current) {
      const svgData = svgRef.current.outerHTML;
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      const link = document.createElement("a");
      link.href = svgUrl;
      link.download = `${downloadFileName}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className={`w-fit ${className}`}>
      <CardContent className="flex flex-col items-center gap-4 p-4">
        {type === "canvas" ? (
          <canvas ref={canvasRef} />
        ) : (
          <svg ref={svgRef} width={size} height={size} />
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={isGenerating}
          className="mt-2 underline"
        >
          Download Barcode
        </Button>

        {includeInput && (
          <div className="w-full mt-4">
            <Label
              htmlFor="qrcode-input"
              className="block mb-2 text-sm font-medium"
            >
              QR Code Content
            </Label>
            <Input
              id="qrcode-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
