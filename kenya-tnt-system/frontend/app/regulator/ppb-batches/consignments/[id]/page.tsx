'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { regulatorApi } from '@/lib/api/regulator';
import { PPBConsignment, PPBBatchDetail } from '@/lib/api/manufacturer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Package, Building2, Truck, MapPin, Box, Layers } from 'lucide-react';

export default function PPBConsignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [consignment, setConsignment] = useState<PPBConsignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadConsignment();
    }
  }, [params.id]);

  const loadConsignment = async () => {
    try {
      setLoading(true);
      const data = await regulatorApi.ppbBatches.getConsignmentById(Number(params.id));
      setConsignment(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load consignment details');
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
      timeZoneName: 'short',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p>Loading consignment details...</p>
        </div>
      </div>
    );
  }

  if (error || !consignment) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Consignment not found'}</p>
        </div>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Consignments
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Consignment Details</h1>
            <p className="text-gray-600 mt-1">Consignment ID: {consignment.consignmentID}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Batches</div>
            <div className="text-2xl font-bold">{consignment.batchCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Products</div>
            <div className="text-2xl font-bold">{consignment.productCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Quantity</div>
            <div className="text-2xl font-bold">{consignment.totalQuantity?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Serial Numbers</div>
            <div className="text-2xl font-bold">{consignment.serialNumberCount?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consignment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Consignment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Consignment ID</label>
              <p className="font-mono font-medium">{consignment.consignmentID}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Registration Number</label>
              <p className="font-mono">{consignment.registrationNo || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Shipment Date</label>
              <p>{formatDate(consignment.shipmentDate)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Country of Origin</label>
              <p>{consignment.countryOfOrigin || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Destination Country</label>
              <p>{consignment.destinationCountry || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Event Timestamp</label>
              <p className="text-xs">{formatDateTime(consignment.eventTimestamp)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Manufacturer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Manufacturer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Manufacturer PPB ID</label>
              <p className="font-mono">{consignment.manufacturerPPBID || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Manufacturer GLN</label>
              <p className="font-mono text-sm">{consignment.manufacturerGLN || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">MAH PPB ID</label>
              <p className="font-mono">{consignment.MAHPPBID || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">MAH GLN</label>
              <p className="font-mono text-sm">{consignment.MAHGLN || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Details */}
      {consignment.batches && consignment.batches.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Batch Details ({consignment.batches.length} batches)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consignment.batches.map((batch: PPBBatchDetail, idx: number) => (
                <div key={batch.id || idx} className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Batch Number</label>
                      <p className="font-mono font-medium">{batch.batchNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Product</label>
                      <p>{batch.product?.brandDisplayName || batch.product?.brandName || 'N/A'}</p>
                      {batch.product?.gtin && (
                        <p className="text-xs text-muted-foreground font-mono">GTIN: {batch.product.gtin}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Quantity</label>
                      <p className="font-semibold">{batch.quantity?.toLocaleString() || 0}</p>
                      {batch.sentQuantity && (
                        <p className="text-xs text-muted-foreground">Sent: {batch.sentQuantity.toLocaleString()}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Expiry Date</label>
                      <p>{formatDate(batch.expiryDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Serial Numbers</label>
                      <p>{batch.serialNumberCount?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-muted-foreground">Event ID</label>
              <p className="font-mono">{consignment.eventID || 'N/A'}</p>
            </div>
            <div>
              <label className="text-muted-foreground">Source System</label>
              <p>{consignment.sourceSystem || 'N/A'}</p>
            </div>
            <div>
              <label className="text-muted-foreground">Created At</label>
              <p>{formatDateTime(consignment.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


