"use client";

import { useMemo } from "react";
import { FormField } from "./FormField";
import { FormConfig, FormFieldType } from "./index";

interface FormSectionsProps {
  config: FormConfig;
  formData: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  handleInputChange: (fieldName: string, value: unknown) => void;
  isSubmitting: boolean;
  onFieldChange?: (
    fieldName: string,
    value: unknown
  ) => Record<string, unknown> | null;
}

export const FormSections = ({
  config,
  formData,
  errors,
  touched,
  handleInputChange,
  isSubmitting,
  onFieldChange,
}: FormSectionsProps) => {
  // Group fields by sections
  const fieldsBySection = useMemo(() => {
    if (!config.sections || config.sections.length === 0) {
      // If no sections defined, group by field.section property or use default
      const grouped: Record<string, FormFieldType[]> = {};
      config.fields.forEach((field) => {
        const sectionName = field.section || 'default';
        if (!grouped[sectionName]) {
          grouped[sectionName] = [];
        }
        grouped[sectionName].push(field);
      });
      return grouped;
    }

    const grouped: Record<string, FormFieldType[]> = {};
    config.sections.forEach((section) => {
      const sectionTitle = section.title || (section as any).name || 'default';
      
      // If section has fields array, use it
      if (section.fields && Array.isArray(section.fields)) {
        grouped[sectionTitle] = section.fields
          .map((fieldName) => config.fields.find((f) => f.name === fieldName))
          .filter(Boolean) as FormFieldType[];
      } else {
        // Otherwise, group fields by their section property matching section title
        const sectionFields = config.fields.filter(
          (f) => f.section === sectionTitle || f.section === (section as any).name
        );
        if (sectionFields.length > 0) {
          grouped[sectionTitle] = sectionFields;
        }
      }
    });

    // Add fields not in any section
    const sectionTitles = new Set(
      config.sections.map((s) => s.title || (s as any).name).filter(Boolean)
    );
    const sectionFieldNames = config.sections
      .filter((s) => s.fields && Array.isArray(s.fields))
      .flatMap((s) => s.fields || []);
    
    const ungroupedFields = config.fields.filter((f) => {
      if (sectionFieldNames.length > 0 && sectionFieldNames.includes(f.name)) {
        return false;
      }
      if (f.section && sectionTitles.has(f.section)) {
        return false;
      }
      return true;
    });
    
    if (ungroupedFields.length > 0) {
      grouped.default = ungroupedFields;
    }

    return grouped;
  }, [config.fields, config.sections]);

  return (
    <div className="space-y-8">
      {Object.entries(fieldsBySection).map(([sectionTitle, fields]) => (
        <div key={sectionTitle} className="space-y-6">
          {config.ui?.showSections && sectionTitle !== "default" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {sectionTitle}
              </h3>
            </div>
          )}

          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${
              config.ui?.fieldSpacing || ""
            }`}
          >
            {fields
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={handleInputChange}
                  error={errors[field.name]}
                  touched={touched[field.name]}
                  disabled={isSubmitting}
                  onFieldChange={onFieldChange}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormSections;
