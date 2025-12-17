'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { distributorApi, Shipment, ReceiveShipmentDto, ForwardShipmentDto } from '@/lib/api/distributor';
import { GenericTable } from '@/components/GenericTable';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { DynamicForm } from '@/components/forms/DynamicForm';
import { FormConfig } from '@/components/forms/types';
import SSCCBarcode from '@/components/SSCCBarcode';

// Simplified form config - most fields auto-filled from selected shipment
const receiveShipmentFormConfig: FormConfig = {
  fields: [
    {
      name: 'ssccBarcode',
      label: 'SSCC (Serial Shipping Container Code)',
      type: 'text',
      placeholder: 'Select a pending shipment or enter SSCC',
      validation: {
        required: true,
        message: 'SSCC is required',
      },
      gridCols: 1,
      section: 'Receive Shipment',
      order: 1,
    },
    {
      name: 'customer',
      label: 'Customer',
      type: 'text',
      placeholder: 'Auto-filled from shipment',
      validation: {
        required: true,
        message: 'Customer is required',
      },
      gridCols: 1,
      section: 'Receive Shipment',
      order: 2,
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
      section: 'Receive Shipment',
      order: 3,
    },
    {
      name: 'expectedDeliveryDate',
      label: 'Expected Delivery Date',
      type: 'date',
      validation: {
        required: true,
        message: 'Expected delivery date is required',
      },
      gridCols: 1,
      section: 'Receive Shipment',
      order: 4,
    },
    {
      name: 'pickupLocation',
      label: 'Origin Location (GLN)',
      type: 'text',
      placeholder: 'Auto-filled from shipment',
      validation: {
        required: true,
        message: 'Pickup location is required',
      },
      gridCols: 1,
      section: 'Receive Shipment',
      order: 5,
    },
    {
      name: 'destinationAddress',
      label: 'Destination Location (GLN)',
      type: 'text',
      placeholder: 'Auto-filled from shipment',
      validation: {
        required: true,
        message: 'Destination address is required',
      },
      gridCols: 1,
      section: 'Receive Shipment',
      order: 6,
    },
    {
      name: 'carrier',
      label: 'Carrier (Logistics Provider)',
      type: 'text',
      placeholder: 'Auto-filled from shipment',
      validation: {
        required: true,
        message: 'Carrier is required',
      },
      gridCols: 1,
      section: 'Receive Shipment',
      order: 7,
    },
  ],
  sections: [
    {
      title: 'Receive Shipment',
      fields: ['ssccBarcode', 'customer', 'pickupDate', 'expectedDeliveryDate', 'pickupLocation', 'destinationAddress', 'carrier'],
      order: 1,
    },
  ],
};

const forwardShipmentFormConfig: FormConfig = {
  fields: [
    {
      name: 'receivedShipmentId',
      label: 'Received Shipment ID',
      type: 'number',
      placeholder: 'Select a received shipment below',
      validation: {
        required: true,
        message: 'Received shipment ID is required',
      },
      gridCols: 1,
      section: 'Forward Shipment',
      order: 1,
    },
    {
      name: 'customer',
      label: 'Destination Facility',
      type: 'text',
      placeholder: 'Select a destination facility below',
      validation: {
        required: true,
        message: 'Destination facility is required',
      },
      gridCols: 1,
      section: 'Forward Shipment',
      order: 2,
    },
    {
      name: 'destinationAddress',
      label: 'Destination GLN/SGLN',
      type: 'text',
      placeholder: 'Auto-filled from facility',
      validation: {
        required: true,
        message: 'Destination address is required',
      },
      gridCols: 1,
      section: 'Forward Shipment',
      order: 3,
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
      section: 'Forward Shipment',
      order: 4,
    },
    {
      name: 'expectedDeliveryDate',
      label: 'Expected Delivery Date',
      type: 'date',
      validation: {
        required: true,
        message: 'Expected delivery date is required',
      },
      gridCols: 1,
      section: 'Forward Shipment',
      order: 5,
    },
    {
      name: 'pickupLocation',
      label: 'Pickup Location (Your Warehouse)',
      type: 'text',
      placeholder: 'Enter your warehouse location',
      validation: {
        required: true,
        message: 'Pickup location is required',
      },
      gridCols: 1,
      section: 'Forward Shipment',
      order: 6,
    },
    {
      name: 'carrier',
      label: 'Carrier (Logistics Provider)',
      type: 'text',
      placeholder: 'Enter carrier name',
      validation: {
        required: true,
        message: 'Carrier is required',
      },
      gridCols: 1,
      section: 'Forward Shipment',
      order: 7,
    },
  ],
  sections: [
    {
      title: 'Forward Shipment',
      fields: ['receivedShipmentId', 'customer', 'destinationAddress', 'pickupDate', 'expectedDeliveryDate', 'pickupLocation', 'carrier'],
      order: 1,
    },
  ],
};

export default function DistributorShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [pendingShipments, setPendingShipments] = useState<Shipment[]>([]);
  const [forwardableShipments, setForwardableShipments] = useState<Shipment[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingForwardable, setLoadingForwardable] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedPendingShipment, setSelectedPendingShipment] = useState<Shipment | null>(null);
  const [selectedForwardableShipment, setSelectedForwardableShipment] = useState<Shipment | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [formData, setFormData] = useState<Partial<ReceiveShipmentDto>>({});
  const [forwardFormData, setForwardFormData] = useState<Partial<ForwardShipmentDto>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShipments();
  }, []);

  useEffect(() => {
    if (showReceiveModal) {
      loadPendingShipments();
    }
  }, [showReceiveModal]);

  useEffect(() => {
    if (showForwardModal) {
      loadForwardableShipments();
      loadFacilities();
    }
  }, [showForwardModal]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const data = await distributorApi.shipments.getReceived();
      setShipments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingShipments = async () => {
    try {
      setLoadingPending(true);
      const data = await distributorApi.shipments.getPending();
      setPendingShipments(data);
    } catch (err: any) {
      console.error('Failed to load pending shipments:', err);
      setPendingShipments([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const loadForwardableShipments = async () => {
    try {
      setLoadingForwardable(true);
      const data = await distributorApi.shipments.getForwardable();
      setForwardableShipments(data);
    } catch (err: any) {
      console.error('Failed to load forwardable shipments:', err);
      setForwardableShipments([]);
    } finally {
      setLoadingForwardable(false);
    }
  };

  const loadFacilities = async () => {
    try {
      const data = await distributorApi.shipments.getDestinations();
      setFacilities(data.premises || []);
    } catch (err: any) {
      console.error('Failed to load facilities:', err);
      setFacilities([]);
    }
  };

  const handleSelectPendingShipment = (shipment: Shipment) => {
    setSelectedPendingShipment(shipment);
    // Auto-fill form with shipment data
    setFormData({
      ssccBarcode: shipment.ssccBarcode,
      customer: shipment.customer,
      pickupDate: shipment.pickupDate ? new Date(shipment.pickupDate).toISOString().split('T')[0] : '',
      expectedDeliveryDate: shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toISOString().split('T')[0] : '',
      pickupLocation: shipment.pickupLocation,
      destinationAddress: shipment.destinationAddress,
      carrier: shipment.carrier,
    });
  };

  const handleSSCCChange = async (sscc: string) => {
    // Auto-search when SSCC is entered (18 digits)
    if (sscc && sscc.length >= 18) {
      try {
        // Search in pending shipments first
        const matchingShipment = pendingShipments.find(s => s.ssccBarcode === sscc);
        if (matchingShipment) {
          handleSelectPendingShipment(matchingShipment);
          return;
        }
        
        console.log('SSCC not found in pending shipments, searching...', sscc);
      } catch (err) {
        console.error('Failed to search SSCC:', err);
      }
    }
  };

  const handleSelectForwardableShipment = (shipment: Shipment) => {
    setSelectedForwardableShipment(shipment);
    
    // Calculate expected delivery date (e.g., 3 days from today)
    const today = new Date();
    const expectedDelivery = new Date(today);
    expectedDelivery.setDate(today.getDate() + 3);
    
    // Auto-fill form with shipment data
    setForwardFormData({
      receivedShipmentId: shipment.id,
      customer: forwardFormData.customer || '',
      pickupDate: today.toISOString().split('T')[0],
      expectedDeliveryDate: expectedDelivery.toISOString().split('T')[0],
      pickupLocation: shipment.destinationAddress || '', // Distributor's location
      destinationAddress: forwardFormData.destinationAddress || '',
      carrier: '',
    });
  };

  const handleSelectFacility = (facility: any) => {
    setSelectedFacility(facility);
    // Auto-fill destination with facility data - preserve existing form data
    setForwardFormData((prev) => ({
      ...prev,
      customer: facility.premiseName,
      destinationAddress: facility.gln || facility.addressLine1 || '',
    }));
  };

  const handleReceive = async (formData: any) => {
    try {
      // Ensure dates are in ISO 8601 format (YYYY-MM-DD)
      const ensureISODate = (dateStr: any): string => {
        if (!dateStr) return '';
        
        const str = String(dateStr).trim();
        
        // Already in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          return str.split('T')[0];
        }
        
        // Try to parse as Date object
        try {
          const date = new Date(str);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Failed to parse date:', str, e);
        }
        
        return str;
      };

      const payload = {
        ...formData,
        pickupDate: ensureISODate(formData.pickupDate),
        expectedDeliveryDate: ensureISODate(formData.expectedDeliveryDate),
      };

      await distributorApi.shipments.receive(payload as ReceiveShipmentDto);
      
      // Show success notification
      toast.success(`Shipment ${payload.ssccBarcode} received successfully! You can now forward it to facilities.`, {
        duration: 5000,
        icon: '✅',
      });
      
      setShowReceiveModal(false);
      setSelectedPendingShipment(null);
      setFormData({});
      loadShipments();
      loadPendingShipments();
    } catch (err: any) {
      console.error('[handleReceive] Error:', err);
      setError(err.message || 'Failed to receive shipment');
    }
  };

  const handleForward = async (formData: any) => {
    try {
      // Ensure dates are in ISO 8601 format
      const ensureISODate = (dateStr: any): string => {
        if (!dateStr) return '';
        const str = String(dateStr).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          return str.split('T')[0];
        }
        try {
          const date = new Date(str);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Failed to parse date:', str, e);
        }
        return str;
      };

      const payload = {
        ...formData,
        receivedShipmentId: parseInt(formData.receivedShipmentId),
        pickupDate: ensureISODate(formData.pickupDate),
        expectedDeliveryDate: ensureISODate(formData.expectedDeliveryDate),
      };

      await distributorApi.shipments.forward(payload as ForwardShipmentDto);
      
      toast.success('Shipment forwarded successfully!', {
        duration: 5000,
        icon: '✅',
      });
      
      setShowForwardModal(false);
      setSelectedForwardableShipment(null);
      setSelectedFacility(null);
      setForwardFormData({});
      loadShipments();
    } catch (err: any) {
      console.error('[handleForward] Error:', err);
      setError(err.message || 'Failed to forward shipment');
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'ssccBarcode', label: 'SSCC' },
    { key: 'parentSsccBarcode', label: 'Parent SSCC' },
    { key: 'customer', label: 'Customer' },
    { key: 'pickupDate', label: 'Pickup Date' },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery' },
    { key: 'isDispatched', label: 'Dispatched' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Distributor Shipments</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowReceiveModal(true)}>Receive Shipment</Button>
          <Button onClick={() => setShowForwardModal(true)} variant="outline">Forward Shipment</Button>
        </div>
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
            </div>
          )}
        </>
      )}

      {showReceiveModal && (
        <Modal
          isOpen={showReceiveModal}
          onClose={() => {
            setShowReceiveModal(false);
            setSelectedPendingShipment(null);
            setFormData({});
          }}
          title="Receive Shipment"
          size="fullscreen"
        >
          <div className="space-y-6">
            {/* Pending Shipments List - ALWAYS SHOW */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold mb-3 text-lg">Pending Shipments Headed to You</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select a shipment below to auto-fill the receiving form with GS1-compliant data.
              </p>
              {loadingPending ? (
                <div className="text-center py-4">Loading pending shipments...</div>
              ) : pendingShipments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-white rounded border-2 border-dashed border-gray-300">
                  <p className="text-lg font-medium mb-2">No pending shipments found</p>
                  <p className="text-sm">Shipments from PPB imports will appear here when they&apos;re destined for you</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pendingShipments.map((shipment) => (
                      <div
                        key={shipment.id}
                        onClick={() => handleSelectPendingShipment(shipment)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedPendingShipment?.id === shipment.id
                            ? 'border-blue-500 bg-blue-100'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1">
                              SSCC: <span className="font-mono">{shipment.ssccBarcode || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div><strong>Customer:</strong> {shipment.customer}</div>
                              <div><strong>Origin:</strong> {shipment.pickupLocation}</div>
                              <div><strong>Destination:</strong> {shipment.destinationAddress}</div>
                              <div><strong>Carrier:</strong> {shipment.carrier}</div>
                              {shipment.pickupDate && (
                                <div><strong>Pickup Date:</strong> {new Date(shipment.pickupDate).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                          {shipment.ssccBarcode && (
                            <div className="ml-4">
                              <SSCCBarcode sscc={shipment.ssccBarcode} />
                            </div>
                          )}
                        </div>
                      </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Entry Option with Auto-Search */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">
                {selectedPendingShipment ? 'Review and Confirm Shipment Details' : 'Or Enter SSCC to Search & Receive'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Paste or enter an SSCC barcode below. The system will automatically fetch shipment details.
              </p>
              <DynamicForm
                key={selectedPendingShipment?.id || 'manual'}
                config={receiveShipmentFormConfig}
                onSubmit={handleReceive}
                onCancel={() => {
                  setShowReceiveModal(false);
                  setSelectedPendingShipment(null);
                  setFormData({});
                }}
                initialData={formData}
                onFieldChange={(fieldName, value) => {
                  if (fieldName === 'ssccBarcode') {
                    handleSSCCChange(value as string);
                  }
                  return null;
                }}
              />
            </div>
          </div>
        </Modal>
      )}

      {showForwardModal && (
        <Modal
          isOpen={showForwardModal}
          onClose={() => {
            setShowForwardModal(false);
            setSelectedForwardableShipment(null);
            setSelectedFacility(null);
            setForwardFormData({});
          }}
          title="Forward Shipment to Facility"
          size="fullscreen"
        >
          <div className="space-y-6">
            {/* Two-column layout for shipments and facilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Received Shipments List */}
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold mb-3 text-lg">Select Received Shipment to Forward</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose a shipment you&apos;ve received that&apos;s ready to forward to a facility.
                </p>
                {loadingForwardable ? (
                  <div className="text-center py-4">Loading received shipments...</div>
                ) : forwardableShipments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No received shipments available to forward. Receive shipments first.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {forwardableShipments.map((shipment) => (
                      <div
                        key={shipment.id}
                        onClick={() => handleSelectForwardableShipment(shipment)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedForwardableShipment?.id === shipment.id
                            ? 'border-green-500 bg-green-100'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1">
                              Shipment ID: <span className="font-mono">{shipment.id}</span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div><strong>Parent SSCC:</strong> {shipment.parentSsccBarcode}</div>
                              <div><strong>Customer:</strong> {shipment.customer}</div>
                              <div><strong>Received At:</strong> {shipment.destinationAddress}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Facilities List */}
              <div className="border rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold mb-3 text-lg">Select Destination Facility</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose the facility (e.g., Kenyatta Hospital) to forward the shipment to.
                </p>
                {!selectedForwardableShipment ? (
                  <div className="text-center py-8 text-gray-500">
                    Please select a received shipment first
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {facilities.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No facilities available</div>
                    ) : (
                      facilities.map((facility) => (
                        <div
                          key={facility.id}
                          onClick={() => handleSelectFacility(facility)}
                          className={`p-3 border rounded cursor-pointer transition-colors ${
                            selectedFacility?.id === facility.id
                              ? 'border-purple-500 bg-purple-100'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1">{facility.premiseName}</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div><strong>GLN:</strong> <span className="font-mono">{facility.gln}</span></div>
                              {facility.addressLine1 && (
                                <div><strong>Address:</strong> {facility.addressLine1}</div>
                              )}
                              {facility.county && (
                                <div><strong>County:</strong> {facility.county}</div>
                              )}
                              {facility.premiseClassification && (
                                <div><strong>Type:</strong> {facility.premiseClassification}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Forward Form */}
            {selectedForwardableShipment && selectedFacility && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Complete Forward Shipment Details</h3>
                <DynamicForm
                  key={`${selectedForwardableShipment?.id}-${selectedFacility?.id}`}
                  config={forwardShipmentFormConfig}
                  onSubmit={handleForward}
                  onCancel={() => {
                    setShowForwardModal(false);
                    setSelectedForwardableShipment(null);
                    setSelectedFacility(null);
                    setForwardFormData({});
                  }}
                  initialData={forwardFormData}
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
