"use client";

import { useState } from "react";
import { FormConfig } from "./types";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { SuccessModal } from "@/components/SuccessModal";
import { FormHeader } from "./FormHeader";
import { FormField } from "./FormField";
import { Button } from "@/components/ui/button";

interface ProductEntry {
  id: number;
  data: Record<string, unknown>;
}

interface MultiProductFormProps {
  config: FormConfig | (() => FormConfig);
  onSubmit: (data: {
    caseLabel: string;
    products: ProductEntry[];
    nonCloneableData: Record<string, unknown>;
  }) => Promise<void>;
  onCancel?: () => void;
  onFieldChange?: (
    fieldName: string,
    value: unknown,
    productId?: number
  ) => Record<string, unknown> | null;
  showHeader?: boolean;
  headerTitle?: string;
  headerDescription?: string;
  confirmationModal?: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  };
  successModal?: {
    title: string;
    message: string;
    onClose?: () => void;
  };
}

export const MultiProductForm = ({
  config,
  onSubmit,
  onCancel,
  onFieldChange,
  showHeader = false,
  headerTitle = "Form",
  headerDescription = "",
  confirmationModal,
  successModal,
}: MultiProductFormProps) => {
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([
    { id: 1, data: {} },
  ]);
  const [caseLabel, setCaseLabel] = useState("");
  const [nonCloneableData, setNonCloneableData] = useState<
    Record<string, unknown>
  >({});
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Get current config (handle both static and dynamic)
  const currentConfig = typeof config === "function" ? config() : config;

  // Get fields that should be cloned for each product entry
  const cloneableFields = currentConfig.fields.filter(
    (field) => field.cloneable !== false
  );
  const nonCloneableFields = currentConfig.fields.filter(
    (field) => field.cloneable === false
  );

  // Validation function
  const validateField = (
    fieldName: string,
    value: unknown,
    formData: Record<string, unknown>
  ): string => {
    const field = currentConfig.fields.find((f) => f.name === fieldName);
    if (!field?.validation) return "";

    const rule = field.validation;

    if (
      rule.required &&
      (!value || (typeof value === "string" && !value.trim()))
    ) {
      return rule.message;
    }

    if (
      rule.pattern &&
      typeof value === "string" &&
      !rule.pattern.test(value)
    ) {
      return rule.message;
    }

    if (
      rule.minLength &&
      typeof value === "string" &&
      value.length < rule.minLength
    ) {
      return rule.message;
    }

    if (
      rule.maxLength &&
      typeof value === "string" &&
      value.length > rule.maxLength
    ) {
      return rule.message;
    }

    if (rule.min && typeof value === "number" && value < rule.min) {
      return rule.message;
    }

    if (rule.max && typeof value === "number" && value > rule.max) {
      return rule.message;
    }

    if (rule.custom) {
      return rule.custom(value as string, formData);
    }

    return "";
  };

  const handleAddProduct = () => {
    const newId = Math.max(...productEntries.map((p) => p.id)) + 1;
    setProductEntries((prev) => [...prev, { id: newId, data: {} }]);
  };

  const handleProductDataChange = (
    productId: number,
    fieldName: string,
    value: unknown
  ) => {
    setProductEntries((prev) =>
      prev.map((entry) =>
        entry.id === productId
          ? { ...entry, data: { ...entry.data, [fieldName]: value } }
          : entry
      )
    );

    // Mark field as touched
    const fieldKey = `${productId}-${fieldName}`;
    setTouched((prev) => ({ ...prev, [fieldKey]: true }));

    // Validate the field
    const entry = productEntries.find((e) => e.id === productId);
    if (entry) {
      const formData = { ...entry.data, [fieldName]: value };
      const error = validateField(fieldName, value, formData);
      setErrors((prev) => ({ ...prev, [fieldKey]: error }));
    }

    // Call the parent's onFieldChange callback and handle auto-fill data
    if (onFieldChange) {
      const autoFillData = onFieldChange(fieldName, value, productId);
      if (autoFillData) {
        // Auto-fill additional fields based on the returned data
        setProductEntries((prev) =>
          prev.map((entry) =>
            entry.id === productId
              ? {
                  ...entry,
                  data: {
                    ...entry.data,
                    ...autoFillData,
                  },
                }
              : entry
          )
        );
      }
    }
  };

  const handleRemoveProduct = (productId: number) => {
    if (productEntries.length > 1) {
      setProductEntries((prev) =>
        prev.filter((entry) => entry.id !== productId)
      );
    }
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Prepare non-cloneable field data
      const finalNonCloneableData: Record<string, unknown> = {
        ...nonCloneableData,
      };
      nonCloneableFields.forEach((field) => {
        if (field.name === "label") {
          finalNonCloneableData[field.name] = caseLabel;
        }
        // Other fields are already in nonCloneableData state
      });

      await onSubmit({
        caseLabel,
        products: productEntries,
        nonCloneableData: finalNonCloneableData,
      });

      // Only show success modal if submission was successful and no error was thrown
      setConfirmModalOpen(false);
      setSuccessModalOpen(true);
    } catch (error) {
      console.error("Form submission failed:", error);

      // Don't show success modal on error - just close confirmation modal
      setConfirmModalOpen(false);
      // Keep the form open so user can see the error and retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (confirmationModal) {
      setConfirmModalOpen(true);
    } else {
      handleFormSubmit();
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    if (successModal?.onClose) {
      successModal.onClose();
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#F4F7FE] to-[#E8F2FF]">
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <FormHeader
            showHeader={showHeader}
            headerTitle={headerTitle}
            headerDescription={headerDescription}
            onCancel={onCancel}
          />

          <div className="p-8">
            <form className="space-y-6">
              {/* Non-cloneable Fields (e.g., Case Label) */}
              {nonCloneableFields.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nonCloneableFields.map((field) => (
                      <FormField
                        key={field.name}
                        field={field}
                        value={
                          field.name === "label"
                            ? caseLabel
                            : nonCloneableData[field.name] || ""
                        }
                        onChange={(fieldName, value) => {
                          if (fieldName === "label") {
                            setCaseLabel(value as string);
                          } else {
                            setNonCloneableData((prev) => ({
                              ...prev,
                              [fieldName]: value,
                            }));
                          }

                          // Mark as touched and validate
                          setTouched((prev) => ({
                            ...prev,
                            [fieldName]: true,
                          }));

                          const formData =
                            fieldName === "label"
                              ? { label: value }
                              : { ...nonCloneableData, [fieldName]: value };

                          const error = validateField(
                            fieldName,
                            value,
                            formData
                          );
                          setErrors((prev) => ({
                            ...prev,
                            [fieldName]: error,
                          }));
                        }}
                        error={errors[field.name] || ""}
                        touched={touched[field.name] || false}
                        disabled={isSubmitting}
                        formData={
                          field.name === "label"
                            ? { label: caseLabel }
                            : nonCloneableData
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Product Entries */}
              {productEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="space-y-6 p-6 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Product {index + 1}
                    </h3>
                    {productEntries.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProduct(entry.id)}
                        className="text-red-600 cursor-pointer hover:text-red-800 hover:bg-red-50 border-red-300"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cloneableFields.map((field) => (
                      <FormField
                        key={field.name}
                        field={field}
                        value={entry.data[field.name]}
                        onChange={(fieldName, value) =>
                          handleProductDataChange(entry.id, fieldName, value)
                        }
                        error={errors[`${entry.id}-${field.name}`] || ""}
                        touched={touched[`${entry.id}-${field.name}`] || false}
                        disabled={isSubmitting}
                        formData={entry.data}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Add Another Product Button */}
              <div className="pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddProduct}
                  className="py-3 px-4 border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  + Add another product
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex items-center justify-end gap-4">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className={
                      currentConfig.cancelButton?.className ||
                      "px-6 py-2 cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed"
                    }
                  >
                    {currentConfig.cancelButton?.text || "Cancel"}
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={isSubmitting}
                  className={
                    currentConfig.submitButton?.className ||
                    "bg-[#0077B6] hover:bg-[#0077B6]/90 text-white font-medium px-8 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-auto disabled:cursor-not-allowed cursor-pointer"
                  }
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {currentConfig.submitButton?.loadingText ||
                        "Creating Case..."}
                    </div>
                  ) : (
                    currentConfig.submitButton?.text || "Create"
                  )}
                </Button>
              </div>
            </form>

            {/* Modals */}
            {confirmationModal && (
              <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={handleFormSubmit}
                title={confirmationModal.title}
                message={confirmationModal.message}
                confirmText={confirmationModal.confirmText || "Yes"}
                cancelText={confirmationModal.cancelText || "No"}
                loading={isSubmitting}
              />
            )}

            {successModal && (
              <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={handleSuccessClose}
                title={successModal.title}
                message={successModal.message}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
