'use client';

import { useState, useEffect } from 'react';
import { regulatorApi, RecallRequest, CreateRecallDto } from '@/lib/api/regulator';
import { GenericTable } from '@/components/GenericTable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { FormConfig } from '@/components/forms/types';

const recallFormConfig: FormConfig = {
  fields: [
    {
      name: 'batchId',
      label: 'Batch ID',
      type: 'number',
      placeholder: 'Enter batch ID to recall',
      validation: {
        required: true,
        message: 'Batch ID is required',
      },
      gridCols: 1,
      section: 'Recall Information',
      order: 1,
    },
    {
      name: 'reason',
      label: 'Reason for Recall',
      type: 'textarea',
      placeholder: 'Enter reason for recall',
      validation: {
        required: true,
        message: 'Reason is required',
      },
      gridCols: 1,
      section: 'Recall Information',
      order: 2,
    },
    {
      name: 'transporter',
      label: 'Transporter',
      type: 'text',
      placeholder: 'Enter transporter name',
      validation: {
        required: true,
        message: 'Transporter is required',
      },
      gridCols: 1,
      section: 'Transportation',
      order: 3,
    },
    {
      name: 'pickupLocation',
      label: 'Pickup Location',
      type: 'text',
      placeholder: 'Enter pickup location',
      validation: {
        required: true,
        message: 'Pickup location is required',
      },
      gridCols: 1,
      section: 'Transportation',
      order: 4,
    },
    {
      name: 'pickupDate',
      label: 'Pickup Date',
      type: 'date',
      validation: {
        required: true,
        message: 'Pickup date is required',
      },
      gridCols: 1,
      section: 'Transportation',
      order: 5,
    },
    {
      name: 'deliveryLocation',
      label: 'Delivery Location',
      type: 'text',
      placeholder: 'Enter delivery location',
      validation: {
        required: true,
        message: 'Delivery location is required',
      },
      gridCols: 1,
      section: 'Transportation',
      order: 6,
    },
    {
      name: 'deliveryDate',
      label: 'Delivery Date',
      type: 'date',
      validation: {
        required: true,
        message: 'Delivery date is required',
      },
      gridCols: 1,
      section: 'Transportation',
      order: 7,
    },
  ],
  sections: [
    {
      title: 'Recall Information',
      order: 1,
    },
    {
      title: 'Transportation',
      order: 2,
    },
  ],
};

export default function RecallPage() {
  const [recalls, setRecalls] = useState<RecallRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecalls();
  }, []);

  const loadRecalls = async () => {
    try {
      setLoading(true);
      const data = await regulatorApi.recall.getAll();
      setRecalls(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load recalls');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      formData.batchId = parseInt(formData.batchId);
      await regulatorApi.recall.create(formData as CreateRecallDto);
      setShowCreateModal(false);
      loadRecalls();
    } catch (err: any) {
      setError(err.message || 'Failed to create recall');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await regulatorApi.recall.updateStatus(id, status);
      loadRecalls();
    } catch (err: any) {
      setError(err.message || 'Failed to update recall status');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'batchId', label: 'Batch ID' },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status' },
    { key: 'transporter', label: 'Transporter' },
    { key: 'pickupDate', label: 'Pickup Date' },
    { key: 'deliveryDate', label: 'Delivery Date' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recall Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>Create Recall</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading recalls...</div>
      ) : (
        <GenericTable
          data={recalls}
          columns={columns}
          actions={[
            {
              label: 'Mark In Progress',
              onClick: (row) => handleUpdateStatus(row.id, 'IN_PROGRESS'),
              condition: (row) => row.status === 'PENDING',
            },
            {
              label: 'Mark Completed',
              onClick: (row) => handleUpdateStatus(row.id, 'COMPLETED'),
              condition: (row) => row.status === 'IN_PROGRESS',
            },
            {
              label: 'Cancel',
              onClick: (row) => handleUpdateStatus(row.id, 'CANCELLED'),
              condition: (row) => row.status !== 'CANCELLED' && row.status !== 'COMPLETED',
            },
          ]}
        />
      )}

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create Recall Request"
          size="xl"
        >
          <DynamicForm
            config={recallFormConfig}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

