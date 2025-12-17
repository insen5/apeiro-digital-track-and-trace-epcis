"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FormConfig, FormState } from "./index";

// Custom hook for form management
export const useForm = (config: FormConfig, initialData?: Record<string, unknown>) => {
  const [state, setState] = useState<FormState>({
    data: initialData || {},
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false,
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update form data when initialData changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      data: initialData || {},
    }));
  }, [initialData]);

  const validateField = useCallback(
    (fieldName: string, value: unknown, formData: Record<string, unknown>): string => {
      const field = config.fields.find(f => f.name === fieldName);
      if (!field?.validation) return "";

      const rule = field.validation;

      if (rule.required && (!value || (typeof value === "string" && !value.trim()))) {
        return rule.message;
      }

      if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
        return rule.message;
      }

      if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
        return rule.message;
      }

      if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength) {
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
    },
    [config.fields]
  );

  const debouncedValidate = useCallback(
    (fieldName: string, value: unknown) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const delay = config.validation?.debounceDelay || 300;
      debounceRef.current = setTimeout(() => {
        const error = validateField(fieldName, value, state.data);
        setState((prev) => ({
          ...prev,
          errors: { ...prev.errors, [fieldName]: error },
          touched: { ...prev.touched, [fieldName]: true },
        }));
      }, delay);
    },
    [state.data, validateField, config.validation?.debounceDelay]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    config.fields.forEach((field) => {
      const error = validateField(field.name, state.data[field.name], state.data);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setState((prev) => ({
      ...prev,
      errors: newErrors,
      isValid,
    }));

    return isValid;
  }, [state.data, validateField, config.fields]);

  const handleInputChange = useCallback(
    (fieldName: string, value: unknown) => {
      setState((prev) => ({
        ...prev,
        data: { ...prev.data, [fieldName]: value },
        touched: { ...prev.touched, [fieldName]: true },
      }));

      // Clear error immediately for better UX
      if (state.errors[fieldName]) {
        setState((prev) => ({
          ...prev,
          errors: { ...prev.errors, [fieldName]: "" },
        }));
      }

      // Debounced validation for complex fields
      if (config.validation?.validateOnChange) {
        const field = config.fields.find(f => f.name === fieldName);
        if (field?.validation && ['email', 'password', 'text', 'number'].includes(field.type)) {
          debouncedValidate(fieldName, value);
        }
      }
    },
    [state.errors, debouncedValidate, config.fields, config.validation?.validateOnChange]
  );

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting }));
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    setState((prev) => ({ ...prev, errors }));
  }, []);

  // Auto-validate form when data changes
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    config.fields.forEach((field) => {
      const error = validateField(field.name, state.data[field.name], state.data);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setState((prev) => ({
      ...prev,
      errors: newErrors,
      isValid,
    }));
  }, [state.data, validateField, config.fields]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    ...state,
    validateForm,
    handleInputChange,
    setSubmitting,
    setErrors,
  };
};
