// Enhanced Types for Dynamic Form
export type FieldType = 
  | "text" 
  | "email" 
  | "password" 
  | "number" 
  | "tel" 
  | "url" 
  | "select" 
  | "multiselect"
  | "textarea" 
  | "checkbox" 
  | "radio"
  | "date"
  | "section";

export type ValidationRule = {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: string, formData: Record<string, unknown>) => string;
  message: string;
};

export type FieldOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type FormField = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  validation?: ValidationRule;
  options?: FieldOption[];
  defaultValue?: string;
  disabled?: boolean;
  readonly?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  showPasswordToggle?: boolean;
  showPasswordStrength?: boolean;
  gridCols?: 1 | 2 | 3 | 4 | 6 | 12;
  section?: string;
  order?: number;
  cloneable?: boolean; // Whether this field should be cloned for each product entry
  dependencyField?: string; // Field name that this field depends on for dynamic loading
  apiOptions?: {
    serviceMethod: (param?: unknown) => Promise<unknown>;
    valueKey: string; // Key for the value in API response
    labelKey: string; // Key for the label in API response
    descriptionKey?: string; // Optional key for description
  };
};

export type FormSection = {
  title: string;
  description?: string;
  fields: string[];
  order?: number;
};

export type FormConfig = {
  fields: FormField[];
  sections?: FormSection[];
  submitButton?: {
    text: string;
    loadingText?: string;
    className?: string;
  };
  cancelButton?: {
    text: string;
    className?: string;
  };
  validation?: {
    debounceDelay?: number;
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
  };
  ui?: {
    showSections?: boolean;
    sectionSpacing?: string;
    fieldSpacing?: string;
    gridCols?: 1 | 2 | 3 | 4 | 6 | 12;
  };
};

export type FormState = {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
};

export type FormProps = {
  config: FormConfig;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  onFieldChange?: (fieldName: string, value: unknown) => Record<string, unknown> | null;
  initialData?: Record<string, unknown>;
  className?: string;
  showHeader?: boolean;
  headerTitle?: string;
  headerDescription?: string;
  showSubmit?: boolean;
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
};