'use client';

import { useState, useEffect } from 'react';
import { manufacturerApi, Case, CreateCaseDto } from '@/lib/api/manufacturer';
import { GenericTable } from '@/components/GenericTable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { FormConfig } from '@/components/forms/types';
import SSCCAssignment from '@/components/SSCCAssignment';

const caseFormConfig: FormConfig = {
  fields: [
    {
      name: 'label',
      label: 'Case Label',
      type: 'text',
      placeholder: 'e.g., CASE-001, CASE-A-2024',
      description: 'A custom identifier for this case (e.g., CASE-001). This is a human-readable label you assign to help organize and track your cases.',
      validation: {
        required: true,
        message: 'Case label is required',
      },
      gridCols: 1,
      section: 'Case Information',
      order: 1,
    },
    {
      name: 'products',
      label: 'Products',
      type: 'custom',
      component: 'ProductEntry',
      validation: {
        required: true,
        message: 'At least one product is required',
      },
      gridCols: 1,
      section: 'Case Information',
      order: 2,
    },
  ],
  sections: [
    {
      title: 'Case Information',
      fields: ['packageId', 'products'],
      order: 1,
    },
  ],
};

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSSCCModal, setShowSSCCModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const data = await manufacturerApi.cases.getAll();
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      // Products should already be an array from ProductEntry component
      if (!Array.isArray(formData.products) || formData.products.length === 0) {
        setError('Please add at least one product to the case');
        return;
      }
      
      // Validate products
      const validProducts = formData.products.filter(
        (p: any) => p.productId && p.batchId && p.qty > 0
      );
      
      if (validProducts.length === 0) {
        setError('Please ensure all products have valid product, batch, and quantity');
        return;
      }
      
      await manufacturerApi.cases.create({
        label: formData.label,
        products: validProducts,
      } as CreateCaseDto);
      setShowCreateModal(false);
      setError(null);
      loadCases();
    } catch (err: any) {
      setError(err.message || 'Failed to create case');
    }
  };

  const handleAssignSSCC = async (sscc?: string) => {
    if (!selectedCase) return;
    const updated = await manufacturerApi.cases.assignSSCC(selectedCase.id, sscc);
    setCases(cases.map(c => c.id === updated.id ? updated : c));
    setShowSSCCModal(false);
    setSelectedCase(null);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'label', label: 'Label' },
    { 
      key: 'ssccBarcode', 
      label: 'SSCC',
      render: (value: unknown) => value ? String(value) : <span className="text-gray-400">Not assigned</span>
    },
    { key: 'packageId', label: 'Package ID' },
    { key: 'isDispatched', label: 'Dispatched' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cases</h1>
        <Button onClick={() => setShowCreateModal(true)}>Create Case</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading cases...</div>
      ) : (
        <GenericTable
          data={cases}
          columns={columns}
          renderActions={(row) => (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCase(row);
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
          title="Create New Case"
          size="xl"
        >
          <DynamicForm
            config={caseFormConfig}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {showSSCCModal && selectedCase && (
        <Modal
          isOpen={showSSCCModal}
          onClose={() => {
            setShowSSCCModal(false);
            setSelectedCase(null);
          }}
          title={`SSCC Assignment - Case #${selectedCase.id}`}
          size="lg"
        >
          <SSCCAssignment
            currentSSCC={selectedCase.ssccBarcode}
            onAssign={handleAssignSSCC}
            label="Case"
            itemId={selectedCase.id}
          />
        </Modal>
      )}
    </div>
  );
}
