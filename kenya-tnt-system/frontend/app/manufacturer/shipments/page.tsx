'use client';

import { useState, useEffect } from 'react';
import { manufacturerApi, Shipment, CreateShipmentDto } from '@/lib/api/manufacturer';
import { GenericTable } from '@/components/GenericTable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { ShipmentForm } from '@/components/forms/ShipmentForm';
import SSCCBarcode from '@/components/SSCCBarcode';

// Removed - using ShipmentForm component instead

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const data = await manufacturerApi.shipments.getAll();
      setShipments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      // Convert comma-separated package IDs to array
      const packageIds = typeof formData.packageIds === 'string'
        ? formData.packageIds.split(',').map((id: string) => parseInt(id.trim()))
        : formData.packageIds;

      const shipmentData: CreateShipmentDto = {
        supplierId: formData.supplierId,
        premiseId: formData.premiseId,
        logisticsProviderId: formData.logisticsProviderId,
        pickupDate: formData.pickupDate,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        packageIds,
        ssccBarcode: formData.ssccBarcode,
      };

      await manufacturerApi.shipments.create(shipmentData);
      setShowCreateModal(false);
      loadShipments();
    } catch (err: any) {
      setError(err.message || 'Failed to create shipment');
    }
  };

  const handleDispatch = async (id: number) => {
    try {
      await manufacturerApi.shipments.dispatch(id);
      loadShipments();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch shipment');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'ssccBarcode', label: 'SSCC' },
    { key: 'pickupDate', label: 'Pickup Date' },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery' },
    { key: 'isDispatched', label: 'Dispatched' },
    { key: 'carrier', label: 'Carrier' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shipments</h1>
        <Button onClick={() => setShowCreateModal(true)}>Create Shipment</Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading shipments...</div>
      ) : (
        <>
          <GenericTable
            data={shipments}
            columns={columns}
          />
          {selectedShipment && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow">
              <h3 className="font-semibold mb-2">Shipment Details</h3>
              <p><strong>SSCC:</strong> {selectedShipment.ssccBarcode}</p>
              {selectedShipment.ssccBarcode && (
                <div className="mt-2">
                  <SSCCBarcode sscc={selectedShipment.ssccBarcode} />
                </div>
              )}
              {!selectedShipment.isDispatched && (
                <Button
                  onClick={() => handleDispatch(selectedShipment.id)}
                  className="mt-4"
                >
                  Dispatch Shipment
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Shipment"
          size="xl"
        >
          <ShipmentForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

