'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { manufacturerApi } from '@/lib/api/manufacturer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Package, Building2, Truck, MapPin } from 'lucide-react';

interface PPBBatch {
  id: number;
  gtin: string;
  product_name: string;
  product_code: string;
  batch_number: string;
  status: string;
  expiration_date?: string;
  manufacture_date?: string;
  permit_id?: string;
  consignment_ref_number?: string;
  approval_status?: boolean;
  approval_date_stamp?: string;
  declared_total?: number;
  declared_sent?: number;
  serialization_range?: string[];
  is_partial_approval?: boolean;
  manufacturer_name?: string;
  manufacturer_gln?: string;
  manufacturing_site_sgln?: string;
  manufacturing_site_label?: string;
  importer_name?: string;
  importer_country?: string;
  importer_gln?: string;
  carrier?: string;
  origin?: string;
  port_of_entry?: string;
  final_destination_sgln?: string;
  final_destination_address?: string;
  processed_status: string;
  processing_error?: string;
  created_date: string;
  last_modified_date: string;
}

export default function ManufacturerPPBBatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [batch, setBatch] = useState<PPBBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadBatch();
    }
  }, [params.id]);

  const loadBatch = async () => {
    try {
      setLoading(true);
      const data = await manufacturerApi.ppbBatches.getById(Number(params.id));
      setBatch(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else if (statusLower === 'recalled') {
      return <Badge className="bg-red-100 text-red-800">Recalled</Badge>;
    } else if (statusLower === 'expired') {
      return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
    } else if (statusLower === 'quarantined') {
      return <Badge className="bg-yellow-100 text-yellow-800">Quarantined</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Batch not found'}</p>
          <Button
            onClick={() => router.push('/manufacturer/ppb-batches')}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          onClick={() => router.push('/manufacturer/ppb-batches')}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Approved Batches
        </Button>
        <h1 className="text-3xl font-bold">Batch Details</h1>
        <p className="text-gray-600 mt-1">PPB Approved Batch Information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Batch Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Batch Number</label>
              <p className="text-lg font-mono font-semibold">{batch.batch_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(batch.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Approval Status</label>
              <div className="mt-1">
                {batch.approval_status ? (
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                )}
              </div>
            </div>
            {batch.approval_date_stamp && (
              <div>
                <label className="text-sm font-medium text-gray-500">Approval Date</label>
                <p className="mt-1">{formatDateTime(batch.approval_date_stamp)}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Permit ID</label>
              <p className="mt-1 font-mono">{batch.permit_id || 'N/A'}</p>
            </div>
            {batch.consignment_ref_number && (
              <div>
                <label className="text-sm font-medium text-gray-500">Consignment Reference</label>
                <p className="mt-1 font-mono">{batch.consignment_ref_number}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Product Name</label>
              <p className="text-lg font-semibold">{batch.product_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">GTIN</label>
              <p className="mt-1 font-mono">{batch.gtin}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Product Code</label>
              <p className="mt-1 font-mono">{batch.product_code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Manufacture Date</label>
              <p className="mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDate(batch.manufacture_date)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Expiration Date</label>
              <p className="mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDate(batch.expiration_date)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quantities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Quantities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Declared Total</label>
              <p className="text-2xl font-bold">{batch.declared_total?.toLocaleString() || 'N/A'}</p>
            </div>
            {batch.declared_sent && (
              <div>
                <label className="text-sm font-medium text-gray-500">Declared Sent</label>
                <p className="text-xl font-semibold">{batch.declared_sent.toLocaleString()}</p>
              </div>
            )}
            {batch.is_partial_approval && (
              <div>
                <Badge className="bg-yellow-100 text-yellow-800">Partial Approval</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Serialization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Serialization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {batch.serialization_range && batch.serialization_range.length > 0 ? (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Serialization Ranges ({batch.serialization_range.length})
                </label>
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {batch.serialization_range.map((range, idx) => (
                    <div key={idx} className="font-mono text-sm bg-gray-50 p-2 rounded">
                      {range}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No serialization ranges</p>
            )}
          </CardContent>
        </Card>

        {/* Manufacturing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Manufacturing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {batch.manufacturer_name && (
              <div>
                <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                <p className="mt-1 font-semibold">{batch.manufacturer_name}</p>
                {batch.manufacturer_gln && (
                  <p className="text-xs text-gray-500 mt-1">GLN: {batch.manufacturer_gln}</p>
                )}
              </div>
            )}
            {batch.manufacturing_site_label && (
              <div>
                <label className="text-sm font-medium text-gray-500">Manufacturing Site</label>
                <p className="mt-1">{batch.manufacturing_site_label}</p>
                {batch.manufacturing_site_sgln && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">SGLN: {batch.manufacturing_site_sgln}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logistics Information */}
        {(batch.carrier || batch.origin || batch.port_of_entry || batch.final_destination_address) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Logistics Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {batch.carrier && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Carrier</label>
                  <p className="mt-1">{batch.carrier}</p>
                </div>
              )}
              {batch.origin && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Origin</label>
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {batch.origin}
                  </p>
                </div>
              )}
              {batch.port_of_entry && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Port of Entry</label>
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {batch.port_of_entry}
                  </p>
                </div>
              )}
              {batch.final_destination_address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Final Destination</label>
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {batch.final_destination_address}
                  </p>
                  {batch.final_destination_sgln && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">SGLN: {batch.final_destination_sgln}</p>
                  )}
                </div>
              )}
              {batch.importer_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Importer</label>
                  <p className="mt-1">{batch.importer_name}</p>
                  {batch.importer_gln && (
                    <p className="text-xs text-gray-500 mt-1">GLN: {batch.importer_gln}</p>
                  )}
                  {batch.importer_country && (
                    <p className="text-xs text-gray-500 mt-1">Country: {batch.importer_country}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <Badge
                  className={
                    batch.processed_status === 'PROCESSED'
                      ? 'bg-green-100 text-green-800'
                      : batch.processed_status === 'ERROR'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {batch.processed_status}
                </Badge>
              </div>
            </div>
            {batch.processing_error && (
              <div>
                <label className="text-sm font-medium text-gray-500">Error</label>
                <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded">
                  {batch.processing_error}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="mt-1 text-sm">{formatDateTime(batch.created_date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Modified</label>
              <p className="mt-1 text-sm">{formatDateTime(batch.last_modified_date)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

