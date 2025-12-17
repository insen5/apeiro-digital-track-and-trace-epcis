'use client';

import { useState, useEffect } from 'react';
import { manufacturerApi, Package, CreatePackageDto } from '@/lib/api/manufacturer';
import { GenericTable } from '@/components/GenericTable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { FormConfig } from '@/components/forms/types';
import SSCCAssignment from '@/components/SSCCAssignment';

const packageFormConfig: FormConfig = {
  fields: [
    {
      name: 'label',
      label: 'Package Label',
      type: 'text',
      placeholder: 'e.g., PKG-001, PACKAGE-A-2024',
      description: 'A custom identifier for this package (e.g., PKG-001). This is a human-readable label you assign to help organize and track your packages.',
      validation: {
        required: true,
        message: 'Package label is required',
      },
      gridCols: 1,
      section: 'Package Information',
      order: 1,
    },
    {
      name: 'caseIds',
      label: 'Select Cases',
      type: 'multiselect',
      placeholder: 'Select cases to include in this package',
      validation: {
        required: true,
        message: 'At least one case is required',
      },
      gridCols: 1,
      section: 'Package Information',
      order: 2,
    },
  ],
  sections: [
    {
      title: 'Package Information',
      fields: ['shipmentId', 'cases'],
      order: 1,
    },
  ],
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSSCCModal, setShowSSCCModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await manufacturerApi.packages.getAll();
      setPackages(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const [caseOptions, setCaseOptions] = useState<Array<{ value: number; label: string; subtitle?: string }>>([]);

  useEffect(() => {
    loadCaseOptions();
  }, []);

  const loadCaseOptions = async () => {
    try {
      const allCases = await manufacturerApi.cases.getAll();
      const availableCases = allCases
        .filter(c => !c.isDispatched && !c.packageId)
        .map(c => ({
          value: c.id,
          label: `${c.label} (ID: ${c.id})`,
          subtitle: c.ssccBarcode ? `SSCC: ${c.ssccBarcode}` : 'No SSCC assigned',
        }));
      setCaseOptions(availableCases);
    } catch (err) {
      console.error('Failed to load cases:', err);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      // caseIds should already be an array from MultiSelect component
      if (!Array.isArray(formData.caseIds) || formData.caseIds.length === 0) {
        setError('Please select at least one case');
        return;
      }
      
      // Convert to numbers if needed
      const caseIds = formData.caseIds.map((id: any) => Number(id));
      
      await manufacturerApi.packages.create({
        label: formData.label,
        caseIds,
      } as CreatePackageDto);
      setShowCreateModal(false);
      setError(null);
      loadPackages();
      loadCaseOptions(); // Refresh case options
    } catch (err: any) {
      setError(err.message || 'Failed to create package');
    }
  };

  const handleAssignSSCC = async (sscc?: string) => {
    if (!selectedPackage) return;
    const updated = await manufacturerApi.packages.assignSSCC(selectedPackage.id, sscc);
    setPackages(packages.map(p => p.id === updated.id ? updated : p));
    setShowSSCCModal(false);
    setSelectedPackage(null);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'label', label: 'Label' },
    { 
      key: 'ssccBarcode', 
      label: 'SSCC',
      render: (value: unknown) => value ? String(value) : <span className="text-gray-400">Not assigned</span>
    },
    { key: 'shipmentId', label: 'Shipment ID' },
    { key: 'isDispatched', label: 'Dispatched' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Packages</h1>
        <Button onClick={() => setShowCreateModal(true)}>Create Package</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading packages...</div>
      ) : (
        <GenericTable
          data={packages}
          columns={columns}
          renderActions={(row) => (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPackage(row);
                setShowSSCCModal(true);
              }}
            >
              {row.ssccBarcode ? 'View SSCC' : 'Assign SSCC'}
            </Button>
          )}
        />
      )}

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Package"
          size="xl"
        >
          <DynamicForm
            config={{
              ...packageFormConfig,
              fields: packageFormConfig.fields.map(field => {
                if (field.name === 'caseIds' && field.type === 'multiselect') {
                  return {
                    ...field,
                    options: caseOptions.map(c => ({
                      value: String(c.value),
                      label: c.label,
                      description: c.subtitle,
                    })),
                  };
                }
                return field;
              }),
            }}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {showSSCCModal && selectedPackage && (
        <Modal
          isOpen={showSSCCModal}
          onClose={() => {
            setShowSSCCModal(false);
            setSelectedPackage(null);
          }}
          title={`SSCC Assignment - Package #${selectedPackage.id}`}
          size="lg"
        >
          <SSCCAssignment
            currentSSCC={selectedPackage.ssccBarcode}
            onAssign={handleAssignSSCC}
            label="Package"
            itemId={selectedPackage.id}
          />
        </Modal>
      )}
    </div>
  );
}

