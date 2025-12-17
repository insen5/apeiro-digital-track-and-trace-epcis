'use client';

import { useState, useEffect } from 'react';
import { manufacturerApi, Batch } from '@/lib/api/manufacturer';
import { GenericTable } from '@/components/GenericTable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { FormConfig } from '@/components/forms/types';

const batchFormConfig: FormConfig = {
  fields: [
    {
      name: 'productId',
      label: 'Product ID',
      type: 'number',
      placeholder: 'Enter product ID from PPB catalog',
      validation: {
        required: true,
        message: 'Product ID is required',
      },
      gridCols: 1,
      section: 'Batch Information',
      order: 1,
    },
    {
      name: 'batchno',
      label: 'Batch Number (Optional)',
      type: 'text',
      placeholder: 'Leave empty to auto-generate',
      gridCols: 1,
      section: 'Batch Information',
      order: 2,
    },
    {
      name: 'expiry',
      label: 'Expiry Date',
      type: 'date',
      validation: {
        required: true,
        message: 'Expiry date is required',
      },
      gridCols: 1,
      section: 'Batch Information',
      order: 3,
    },
    {
      name: 'qty',
      label: 'Quantity',
      type: 'number',
      placeholder: 'Enter batch quantity',
      validation: {
        required: true,
        min: 1,
        message: 'Quantity must be at least 1',
      },
      gridCols: 1,
      section: 'Batch Information',
      order: 4,
    },
  ],
  sections: [
    {
      title: 'Batch Information',
      fields: ['productId', 'batchno', 'expiry', 'qty'],
      order: 1,
    },
  ],
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await manufacturerApi.batches.getAll();
      setBatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      await manufacturerApi.batches.create(formData);
      setShowCreateModal(false);
      loadBatches();
    } catch (err: any) {
      setError(err.message || 'Failed to create batch');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'batchno', label: 'Batch Number' },
    { key: 'expiry', label: 'Expiry Date' },
    { key: 'qty', label: 'Quantity' },
    { key: 'sentQty', label: 'Sent Quantity' },
    { key: 'isEnabled', label: 'Status' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Batches</h1>
        <Button onClick={() => setShowCreateModal(true)}>Create Batch</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading batches...</div>
      ) : (
        <GenericTable
          data={batches}
          columns={columns}
        />
      )}

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Batch"
          size="xl"
        >
          <DynamicForm
            config={batchFormConfig}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

