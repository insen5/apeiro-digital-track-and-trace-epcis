/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { SuccessModal } from "@/components/SuccessModal";
import { useForm } from "./useForm";
import { FormHeader } from "./FormHeader";
import { FormSections } from "./FormSections";
import { FormActions } from "./FormActions";
import { ErrorDisplay } from "./ErrorDisplay";
import { FormProps } from "./index";

// Main Dynamic Form Component
export const DynamicForm = ({
  config,
  onSubmit,
  onCancel,
  onFieldChange,
  initialData,
  className = "",
  showHeader = false,
  headerTitle = "Form",
  headerDescription = "",
  showSubmit = true,
  confirmationModal,
  successModal,
}: FormProps) => {
  const {
    data: formData,
    errors,
    touched,
    isValid,
    isSubmitting,
    validateForm,
    handleInputChange,
    setSubmitting,
    setErrors,
  } = useForm(config, initialData);

  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);

  const handleFormSubmit = useCallback(async () => {
    setSubmitting(true);

    try {
      await onSubmit(formData);
      setConfirmModalOpen(false);
      setSuccessModalOpen(true);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred. Please try again.";

      setErrors({ general: errorMessage });
    } finally {
      setSubmitting(false);
      setConfirmModalOpen(false);
    }
  }, [formData, onSubmit, setSubmitting, setErrors]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validateForm()) {
        if (confirmationModal) {
          setConfirmModalOpen(true);
        } else {
          handleFormSubmit();
        }
      }
    },
    [validateForm, confirmationModal, handleFormSubmit]
  );

  const handleSuccessClose = useCallback(() => {
    setSuccessModalOpen(false);
    if (successModal?.onClose) {
      successModal.onClose();
    } else if (onCancel) {
      onCancel();
    }
  }, [successModal, onCancel]);

  return (
    <div
      className={` bg-gradient-to-br from-[#F4F7FE] to-[#E8F2FF] ${className}`}
    >
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <FormHeader
            showHeader={showHeader}
            headerTitle={headerTitle}
            headerDescription={headerDescription}
            onCancel={onCancel}
          />

          <div className="p-8">
            <ErrorDisplay error={errors.general} />

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormSections
                config={config}
                formData={formData}
                errors={errors}
                touched={touched}
                handleInputChange={handleInputChange}
                isSubmitting={isSubmitting}
                onFieldChange={onFieldChange}
              />

              <FormActions
                config={config}
                isSubmitting={isSubmitting}
                isValid={isValid}
                onCancel={onCancel}
                showSubmit={showSubmit}
              />
            </form>

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

export default DynamicForm;
