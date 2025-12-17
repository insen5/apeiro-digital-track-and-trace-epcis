'use client';

import { useState, useEffect, useMemo } from 'react';
import { manufacturerApi } from '@/lib/api/manufacturer';
import { GenericTable } from '@/components/GenericTable';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Search, Calendar, Package, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function ManufacturerPPBBatchesPage() {
  const [batches, setBatches] = useState<PPBBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadBatches();
  }, [page, searchTerm]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const response = await manufacturerApi.ppbBatches.getAll(page, limit, searchTerm || undefined);
      setBatches(response.batches);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load approved batches');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format date with time
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge color
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

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBatches = batches.length;
    const active = batches.filter(b => b.status?.toLowerCase() === 'active').length;
    const approved = batches.filter(b => b.approval_status === true).length;
    return { totalBatches, active, approved };
  }, [batches]);

  const columns = [
    {
      key: 'batch_number',
      label: 'Batch Number',
      render: (value: unknown) => (
        <span className="font-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      key: 'product_name',
      label: 'Product',
      render: (value: string, row: PPBBatch) => (
        <div className="min-w-[200px]">
          <div className="font-medium">{value}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            GTIN: {row.gtin} | Code: {row.product_code}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: unknown) => getStatusBadge(value),
    },
    {
      key: 'approval_status',
      label: 'Approval',
      render: (value: boolean, row: PPBBatch) => (
        <div>
          {value ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
          )}
          {row.approval_date_stamp && (
            <div className="text-xs text-muted-foreground mt-1">
              {formatDateTime(row.approval_date_stamp)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'expiration_date',
      label: 'Expiry Date',
      render: (value: unknown) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <span>{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: 'declared_total',
      label: 'Quantities',
      render: (value: number, row: PPBBatch) => (
        <div>
          <div>Total: {row.declared_total?.toLocaleString() || 'N/A'}</div>
          {row.declared_sent && (
            <div className="text-xs text-muted-foreground">
              Sent: {row.declared_sent.toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'serialization_range',
      label: 'Serialization',
      render: (value: unknown) => (
        <div className="max-w-[200px]">
          {value && value.length > 0 ? (
            <div className="text-xs">
              {value.length === 1 ? (
                <span className="font-mono">{value[0]}</span>
              ) : (
                <div>
                  <div className="font-medium mb-1">{value.length} ranges</div>
                  {value.slice(0, 2).map((range, idx) => (
                    <div key={idx} className="font-mono text-xs text-muted-foreground">
                      {range}
                    </div>
                  ))}
                  {value.length > 2 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      +{value.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">No ranges</span>
          )}
        </div>
      ),
    },
    {
      key: 'manufacturing_site_label',
      label: 'Manufacturing Site',
      render: (value: string, row: PPBBatch) => (
        <div>
          <div className="font-medium">{value || 'N/A'}</div>
          {row.manufacturing_site_sgln && (
            <div className="text-xs text-muted-foreground mt-0.5">
              SGLN: {row.manufacturing_site_sgln}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'port_of_entry',
      label: 'Port of Entry',
      render: (value: string, row: PPBBatch) => (
        <div>
          {value ? (
            <>
              <div className="font-medium">{value}</div>
              {row.origin && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Origin: {row.origin}
                </div>
              )}
            </>
          ) : (
            <span className="text-muted-foreground text-xs">N/A</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_date',
      label: 'Approved',
      render: (value: unknown) => (
        <div className="text-xs text-muted-foreground">
          {formatDate(value)}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">PPB Approved Batches</h1>
          <p className="text-gray-600 mt-1">
            View batches approved by PPB for your organization
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Approved</p>
                <p className="text-2xl font-bold">{stats.totalBatches}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Batches</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Status</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by batch number, product name, or GTIN..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <GenericTable
          data={batches}
          columns={columns}
          loading={loading}
          onRowClick={(row) => {
            // Navigate to batch details
            window.location.href = `/manufacturer/ppb-batches/${row.id}`;
          }}
        />
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} batches
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

