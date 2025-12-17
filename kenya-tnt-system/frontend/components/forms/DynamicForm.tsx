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
    <div className={className}>
      <div className="bg-gradient-to-br from-[#F4F7FE] via-[#F0F5FF] to-[#E8F2FF] rounded-xl shadow-lg border border-border/50 overflow-hidden">
          <FormHeader
            showHeader={showHeader}
            headerTitle={headerTitle}
            headerDescription={headerDescription}
            onCancel={onCancel}
          />

          <div className="p-8 bg-gradient-to-br from-card via-card to-accent/5">
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
  );
};

export default DynamicForm;
