"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { FormFieldType } from "./index";
import { useApiOptions } from "./useApiOptions";
import { useDynamicApiOptions } from "./useDynamicApiOptions";

// Password strength indicator component
const PasswordStrengthIndicator = ({
  password,
  requirements,
}: {
  password: string;
  requirements: {
    minLength: number;
    hasUppercase: RegExp;
    hasLowercase: RegExp;
    hasNumber: RegExp;
    hasSpecialChar: RegExp;
  };
}) => {
  const checks = [
    {
      label: `${requirements.minLength}+ characters`,
      met: password.length >= requirements.minLength,
    },
    {
      label: "Uppercase letter",
      met: requirements.hasUppercase.test(password),
    },
    {
      label: "Lowercase letter",
      met: requirements.hasLowercase.test(password),
    },
    { label: "Number", met: requirements.hasNumber.test(password) },
    {
      label: "Special character",
      met: requirements.hasSpecialChar.test(password),
    },
  ];

  const strength = checks.filter((check) => check.met).length;
  const strengthLevel =
    strength < 2 ? "weak" : strength < 4 ? "medium" : "strong";

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              strengthLevel === "weak"
                ? "bg-red-500 w-1/5"
                : strengthLevel === "medium"
                ? "bg-yellow-500 w-3/5"
                : "bg-green-500 w-full"
            }`}
          />
        </div>
        <span className="text-xs font-medium capitalize">{strengthLevel}</span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-1">
            {check.met ? (
              <CheckCircle className="w-3 h-3 text-green-500" />
            ) : (
              <AlertCircle className="w-3 h-3 text-gray-400" />
            )}
            <span className={check.met ? "text-green-600" : "text-gray-500"}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Individual form field component
export const FormField = ({
  field,
  value,
  onChange,
  error,
  touched,
  disabled,
  formData,
  onFieldChange,
}: {
  field: FormFieldType;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  formData?: Record<string, unknown>;
  onFieldChange?: (
    fieldName: string,
    value: unknown
  ) => Record<string, unknown> | null;
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = field.showPasswordToggle
    ? showPassword
      ? "text"
      : "password"
    : field.type;

  const gridCols = field.gridCols || 1;
  const gridClass = `col-span-${gridCols}`;

  // Get dependency value for dynamic API calls
  const dependencyValue =
    field.dependencyField && formData
      ? formData[field.dependencyField]
      : undefined;

  // Always call both hooks, but conditionally enable them
  const dynamicApiResult = useDynamicApiOptions({
    serviceMethod:
      field.apiOptions?.serviceMethod || (() => Promise.resolve([])),
    valueKey: field.apiOptions?.valueKey || "",
    labelKey: field.apiOptions?.labelKey || "",
    descriptionKey: field.apiOptions?.descriptionKey,
    enabled:
      field.type === "select" && !!field.apiOptions && !!field.dependencyField,
    dependencyValue,
    dependencyField: field.dependencyField || "",
  });

  const staticApiResult = useApiOptions(
    field.apiOptions
      ? {
          serviceMethod: field.apiOptions.serviceMethod,
          valueKey: field.apiOptions.valueKey,
          labelKey: field.apiOptions.labelKey,
          descriptionKey: field.apiOptions.descriptionKey,
          enabled:
            field.type === "select" &&
            !!field.apiOptions &&
            !field.dependencyField,
        }
      : {
          serviceMethod: () => Promise.resolve([]),
          valueKey: "",
          labelKey: "",
          enabled: false,
        }
  );

  // Use the appropriate result based on whether field has dependency
  const {
    options: apiOptions,
    loading: apiLoading,
    error: apiError,
  } = field.dependencyField ? dynamicApiResult : staticApiResult;

  const selectOptions = field.apiOptions ? apiOptions : field.options || [];

  const renderField = () => {
    switch (field.type) {
      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(val) => {
              onChange(field.name, val);
              // Handle auto-fill if onFieldChange is provided
              if (onFieldChange) {
                const autoFillData = onFieldChange(field.name, val);
                if (autoFillData) {
                  // Apply auto-fill data to other fields
                  Object.entries(autoFillData).forEach(([key, value]) => {
                    onChange(key, value);
                  });
                }
              }
            }}
            disabled={disabled || field.disabled || apiLoading}
          >
            <SelectTrigger
              className={`w-full bg-[#F6F6F6DE] transition-colors ${
                error && touched
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-[#0077B6]"
              }`}
            >
              <SelectValue
                placeholder={
                  apiLoading
                    ? "Loading options..."
                    : field.placeholder || `Select ${field.label}`
                }
              />
            </SelectTrigger>
            <SelectContent>
              {apiLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">
                    Loading options...
                  </span>
                </div>
              ) : apiError ? (
                <div className="flex items-center justify-center p-4">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-500">
                    Failed to load options
                  </span>
                </div>
              ) : (
                selectOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-gray-500">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md bg-[#F6F6F6DE] p-2">
              {apiLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">
                    Loading options...
                  </span>
                </div>
              ) : apiError ? (
                <div className="flex items-center justify-center p-4">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-500">
                    Failed to load options
                  </span>
                </div>
              ) : selectOptions.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <span className="text-sm text-gray-500">
                    No options available
                  </span>
                </div>
              ) : (
                selectOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer ${
                      option.disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={(e) => {
                        if (option.disabled) return;
                        const newValues = e.target.checked
                          ? [...selectedValues, option.value]
                          : selectedValues.filter((v) => v !== option.value);
                        onChange(field.name, newValues);
                      }}
                      disabled={disabled || field.disabled || option.disabled}
                      className="mt-1 h-4 w-4 text-[#0077B6] border-gray-300 rounded focus:ring-[#0077B6]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
            {selectedValues.length > 0 && (
              <div className="text-xs text-gray-600">
                {selectedValues.length} item
                {selectedValues.length !== 1 ? "s" : ""} selected
              </div>
            )}
          </div>
        );

      case "textarea":
        return (
          <textarea
            id={field.name}
            placeholder={field.placeholder}
            value={(value as string) || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={disabled || field.disabled}
            readOnly={field.readonly}
            maxLength={field.maxLength}
            className={`w-full bg-[#F6F6F6DE] transition-colors rounded-md border px-3 py-2 text-sm ${
              error && touched
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-[#0077B6]"
            }`}
            rows={3}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.name}
              checked={!!value}
              onChange={(e) => onChange(field.name, e.target.checked)}
              disabled={disabled || field.disabled}
              className="h-4 w-4 text-[#0077B6] focus:ring-[#0077B6] border-gray-300 rounded"
            />
            <Label
              htmlFor={field.name}
              className="text-sm font-medium text-gray-700"
            >
              {field.label}
            </Label>
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.name}-${option.value}`}
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(field.name, e.target.value)}
                  disabled={disabled || field.disabled || option.disabled}
                  className="h-4 w-4 text-[#0077B6] focus:ring-[#0077B6] border-gray-300"
                />
                <Label
                  htmlFor={`${field.name}-${option.value}`}
                  className="text-sm font-medium text-gray-700"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "date":
        return (
          <Input
            id={field.name}
            type="date"
            placeholder={field.placeholder}
            value={(value as string) || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={disabled || field.disabled}
            readOnly={field.readonly}
            className={`w-full bg-[#F6F6F6DE] transition-colors rounded-md border px-3 py-2 text-sm ${
              error && touched
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-[#0077B6]"
            }`}
          />
        );

      default:
        return (
          <div className="relative">
            <Input
              id={field.name}
              type={inputType}
              placeholder={field.placeholder}
              value={(value as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled || field.disabled}
              readOnly={field.readonly}
              maxLength={field.maxLength}
              min={field.min}
              max={field.max}
              className={`w-full bg-[#F6F6F6DE] transition-colors ${
                error && touched
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-[#0077B6]"
              }`}
            />
            {field.showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`space-y-2 ${gridClass}`}>
      {field.type !== "checkbox" && (
        <Label
          htmlFor={field.name}
          className="text-sm font-medium text-gray-700"
        >
          {field.label} {field.validation?.required && "*"}
        </Label>
      )}
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
      {renderField()}
      {field.showPasswordStrength &&
        field.type === "password" &&
        typeof value === "string" &&
        value.length > 0 && (
          <PasswordStrengthIndicator
            password={value}
            requirements={{
              minLength: 8,
              hasUppercase: /[A-Z]/,
              hasLowercase: /[a-z]/,
              hasNumber: /\d/,
              hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/,
            }}
          />
        )}
      {error && touched && (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FormField;
