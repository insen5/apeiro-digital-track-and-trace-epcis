"use client";

import { useState, useEffect } from "react";
import { FieldOption } from "./types";

interface UseDynamicApiOptionsProps {
  serviceMethod: (param?: unknown) => Promise<unknown>;
  valueKey: string;
  labelKey: string;
  descriptionKey?: string;
  enabled?: boolean;
  dependencyValue?: unknown; // Value that triggers refetch (e.g., selected product ID)
  dependencyField?: string; // Name of the field this depends on
}

export const useDynamicApiOptions = ({
  serviceMethod,
  valueKey,
  labelKey,
  descriptionKey,
  enabled = true,
  dependencyValue,
  dependencyField,
}: UseDynamicApiOptionsProps) => {
  const [options, setOptions] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !serviceMethod) return;

    // If this field depends on another field, only fetch when dependency has a value
    if (dependencyField && !dependencyValue) {
      setOptions([]);
      return;
    }

    const fetchOptions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await serviceMethod(dependencyValue);
        
        // Handle different response formats
        let items = response;
        const responseObj = response as Record<string, unknown>;
        
        if (responseObj?.data && Array.isArray(responseObj.data)) {
          items = responseObj.data;
        } else if (responseObj?.items && Array.isArray(responseObj.items)) {
          items = responseObj.items;
        } else if (responseObj?.results && Array.isArray(responseObj.results)) {
          items = responseObj.results;
        } else if (Array.isArray(response)) {
          items = response;
        }
        
        if (!Array.isArray(items)) {
          throw new Error('Invalid response format: expected array');
        }
        
        const formattedOptions: FieldOption[] = items.map((item: Record<string, unknown>) => ({
          value: String(item[valueKey] || ''),
          label: String(item[labelKey] || ''),
          description: descriptionKey ? String(item[descriptionKey] || '') : undefined,
        }));
        
        setOptions(formattedOptions);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch options';
        setError(errorMessage);
        console.error('Error fetching API options:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [serviceMethod, valueKey, labelKey, descriptionKey, enabled, dependencyValue, dependencyField]);

  return { options, loading, error };
};
