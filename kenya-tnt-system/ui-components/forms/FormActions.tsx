"use client";

import { Button } from "@/components/ui/button";
import { FormConfig } from "./index";

interface FormActionsProps {
  config: FormConfig;
  isSubmitting: boolean;
  isValid: boolean;
  onCancel?: () => void;
  showSubmit?: boolean;
}

export const FormActions = ({
  config,
  isSubmitting,
  isValid,
  onCancel,
  showSubmit = true,
}: FormActionsProps) => {
  return (
    <div className="pt-6 flex items-center justify-end gap-4">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className={
            config.cancelButton?.className ||
            "px-6 py-2 cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed"
          }
        >
          {config.cancelButton?.text || "Cancel"}
        </Button>
      )}
      {showSubmit && (
        <Button
          type="submit"
          className={
            config.submitButton?.className ||
            "bg-[#0077B6] hover:bg-[#0077B6]/90 text-white font-medium px-8 py-2 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-auto disabled:cursor-not-allowed cursor-pointer"
          }
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {config.submitButton?.loadingText || "Submitting..."}
            </div>
          ) : (
            config.submitButton?.text || "Submit"
          )}
        </Button>
      )}
    </div>
  );
};

export default FormActions;
