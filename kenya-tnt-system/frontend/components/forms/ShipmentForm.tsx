'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/SearchableSelect';
import { masterDataApi, Supplier, Premise, LogisticsProvider } from '@/lib/api/master-data';
import { showToast } from '@/lib/toast';

interface ShipmentFormData {
  supplierId?: number;
  premiseId?: number;
  logisticsProviderId?: number;
  pickupDate: string;
  expectedDeliveryDate: string;
  packageIds: string;
  ssccBarcode?: string;
}

interface ShipmentFormProps {
  onSubmit: (data: ShipmentFormData) => Promise<void>;
  onCancel: () => void;
}

export const ShipmentForm: React.FC<ShipmentFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ShipmentFormData>({
    pickupDate: '',
    expectedDeliveryDate: '',
    packageIds: '',
  });

  // Master data options
  const [supplierOptions, setSupplierOptions] = useState<SearchableSelectOption[]>([]);
  const [premiseOptions, setPremiseOptions] = useState<SearchableSelectOption[]>([]);
  const [lspOptions, setLspOptions] = useState<SearchableSelectOption[]>([]);

  // Loading states
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingPremises, setLoadingPremises] = useState(false);
  const [loadingLSPs, setLoadingLSPs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    loadSuppliers();
    loadPremises();
    loadLSPs();
  }, []);

  const loadSuppliers = async (search?: string) => {
    try {
      setLoadingSuppliers(true);
      const response = await masterDataApi.suppliers.getAll(1, 50, search);
      const options: SearchableSelectOption[] = response.suppliers.map((s) => ({
        value: s.id,
        label: s.legalEntityName,
        subtitle: `${s.ppbCode || s.entityId}${s.legalEntityGLN ? ` • GLN: ${s.legalEntityGLN}` : ''}`,
      }));
      setSupplierOptions(options);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to load suppliers');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadPremises = async (search?: string) => {
    try {
      setLoadingPremises(true);
      const response = await masterDataApi.premises.getAll(1, 50, search);
      const options: SearchableSelectOption[] = response.premises.map((p) => ({
        value: p.id,
        label: p.premiseName,
        subtitle: `${p.gln}${p.county ? ` • ${p.county}` : ''}${p.addressLine1 ? ` • ${p.addressLine1}` : ''}`,
      }));
      setPremiseOptions(options);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to load premises');
    } finally {
      setLoadingPremises(false);
    }
  };

  const loadLSPs = async (search?: string) => {
    try {
      setLoadingLSPs(true);
      const response = await masterDataApi.logisticsProviders.getAll(1, 50, search);
      const options: SearchableSelectOption[] = response.logisticsProviders.map((lsp) => ({
        value: lsp.id,
        label: lsp.name,
        subtitle: `${lsp.lspId}${lsp.gln ? ` • GLN: ${lsp.gln}` : ''}`,
      }));
      setLspOptions(options);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to load logistics providers');
    } finally {
      setLoadingLSPs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.supplierId && !formData.premiseId && !formData.logisticsProviderId) {
      showToast.error('Please select at least one master data option or use legacy fields');
      return;
    }

    if (!formData.pickupDate || !formData.expectedDeliveryDate || !formData.packageIds) {
      showToast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to create shipment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier (Customer) */}
        <div>
          <SearchableSelect
            label="Supplier (Customer)"
            options={supplierOptions}
            value={formData.supplierId}
            onChange={(value) => setFormData({ ...formData, supplierId: value as number })}
            placeholder="Select supplier..."
            searchPlaceholder="Search suppliers..."
            onSearch={loadSuppliers}
            loading={loadingSuppliers}
            required
          />
        </div>

        {/* Premise (Location) */}
        <div>
          <SearchableSelect
            label="Premise (Pickup/Destination Location)"
            options={premiseOptions}
            value={formData.premiseId}
            onChange={(value) => setFormData({ ...formData, premiseId: value as number })}
            placeholder="Select premise..."
            searchPlaceholder="Search premises..."
            onSearch={loadPremises}
            loading={loadingPremises}
            required
          />
        </div>

        {/* Logistics Provider (Carrier) */}
        <div>
          <SearchableSelect
            label="Logistics Provider (Carrier)"
            options={lspOptions}
            value={formData.logisticsProviderId}
            onChange={(value) => setFormData({ ...formData, logisticsProviderId: value as number })}
            placeholder="Select logistics provider..."
            searchPlaceholder="Search logistics providers..."
            onSearch={loadLSPs}
            loading={loadingLSPs}
            required
          />
        </div>

        {/* Pickup Date */}
        <div>
          <Label htmlFor="pickupDate">
            Pickup Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="pickupDate"
            type="date"
            value={formData.pickupDate}
            onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
            required
          />
        </div>

        {/* Expected Delivery Date */}
        <div>
          <Label htmlFor="expectedDeliveryDate">
            Expected Delivery Date <span className="text-red-500">*</span>
          </Label>
          <Input
            id="expectedDeliveryDate"
            type="date"
            value={formData.expectedDeliveryDate}
            onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
            required
          />
        </div>

        {/* Package IDs */}
        <div>
          <Label htmlFor="packageIds">
            Package IDs (comma-separated) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="packageIds"
            type="text"
            placeholder="e.g., 1,2,3"
            value={formData.packageIds}
            onChange={(e) => setFormData({ ...formData, packageIds: e.target.value })}
            required
          />
        </div>

        {/* SSCC (Optional) */}
        <div>
          <Label htmlFor="ssccBarcode">
            SSCC (Optional - Auto-generated if not provided)
          </Label>
          <Input
            id="ssccBarcode"
            type="text"
            placeholder="Leave empty to auto-generate SSCC"
            value={formData.ssccBarcode || ''}
            onChange={(e) => setFormData({ ...formData, ssccBarcode: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
};

