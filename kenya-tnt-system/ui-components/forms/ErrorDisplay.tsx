"use client";

import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  error?: string;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">Error</span>
      </div>
      <p className="mt-1 text-red-600">{error}</p>
    </div>
  );
};

export default ErrorDisplay;
