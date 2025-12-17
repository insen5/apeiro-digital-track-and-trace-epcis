'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { GenericTable } from '@/components/GenericTable';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { manufacturerApi } from '@/lib/api/manufacturer';
import { showToast } from '@/lib/toast';
import { FileText, Package, Box, Barcode, ChevronDown, ChevronRight, Truck, Layers } from 'lucide-react';
import { PPBConsignment, PPBBatchDetail } from '@/lib/api/manufacturer';

export default function ConsignmentsPage() {
  const [consignments, setConsignments] = useState<PPBConsignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadConsignments();
  }, []);

  const loadConsignments = async () => {
    setLoading(true);
    try {
      const data = await manufacturerApi.consignments.getAll();
      setConsignments(data);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to load consignments');
    } finally {
      setLoading(false);
    }
  };


  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalConsignments = consignments.length;
    const totalBatches = consignments.reduce((sum, c) => sum + c.batchCount, 0);
    const totalProducts = consignments.reduce((sum, c) => sum + c.productCount, 0);
    const totalSerialNumbers = consignments.reduce((sum, c) => sum + c.serialNumberCount, 0);
    return { totalConsignments, totalBatches, totalProducts, totalSerialNumbers };
  }, [consignments]);

  const columns = [
    {
      key: 'expand',
      label: '',
      render: (_: unknown, row: PPBConsignment) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRow(row.id);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {expandedRows.has(row.id) ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      ),
    },
    { 
      key: 'consignmentID', 
      label: 'Consignment Details',
      render: (value: unknown, row: PPBConsignment) => (
        <div className="space-y-1">
          <div className="font-mono text-sm font-semibold">{String(value || "")}</div>
          <div className="text-xs text-gray-500 font-mono">{row.eventID || 'N/A'}</div>
          <div className="text-xs text-gray-600 font-mono">{row.registrationNo || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'manufacturerGLN',
      label: 'MAH / Manufacturer',
      render: (value: string, row: PPBConsignment) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{row.manufacturerPPBID || 'N/A'}</div>
          {value && (
            <div className="text-xs text-gray-500 font-mono">
              GLN: {value}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'importerInfo',
      label: 'Importer',
      render: (_: unknown, row: PPBConsignment) => (
        <div className="space-y-1">
          {row.importerPartyName ? (
            <>
              <div className="font-medium text-sm text-blue-700">{row.importerPartyName}</div>
              {row.importerPartyGLN && (
                <div className="text-xs text-gray-500 font-mono">
                  GLN: {row.importerPartyGLN}
                </div>
              )}
              {row.importerPartyCountry && (
                <div className="text-xs text-gray-600 uppercase">
                  {row.importerPartyCountry}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-400">N/A</div>
          )}
        </div>
      )
    },
    {
      key: 'destinationInfo',
      label: 'Final Destination',
      render: (_: unknown, row: PPBConsignment) => (
        <div className="space-y-1">
          {row.destinationPartyName ? (
            <>
              <div className="font-medium text-sm text-green-700">{row.destinationPartyName}</div>
              {row.destinationPartyGLN && (
                <div className="text-xs text-gray-500 font-mono">
                  GLN: {row.destinationPartyGLN}
                </div>
              )}
              {row.destinationLocationLabel && (
                <div className="text-xs text-gray-600">
                  📍 {row.destinationLocationLabel}
                </div>
              )}
              <div className="text-xs text-gray-600 uppercase">
                {row.destinationCountry}
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <div className="text-sm font-medium text-green-700 uppercase">
                {row.destinationCountry || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
                {row.destinationCountry === 'KE' ? 'Kenya' : row.destinationCountry}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'uniqueGTINs',
      label: 'GTINs',
      render: (value: unknown) => {
        const gtins = Array.isArray(value) ? value : [];
        return gtins.length > 0 ? (
          <div className="flex flex-col gap-1">
            {gtins.slice(0, 2).map((gtin, idx) => (
              <span key={idx} className="font-mono text-xs text-purple-600">{String(gtin)}</span>
            ))}
            {gtins.length > 2 && (
              <span className="text-xs text-gray-500">+{gtins.length - 2} more</span>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-xs">N/A</span>
        );
      }
    },
    {
      key: 'productCount',
      label: 'Products',
      render: (value: unknown) => (
        <span className="font-semibold">{String(value || "")}</span>
      )
    },
    {
      key: 'batchCount',
      label: 'Batches',
      render: (value: number, row: PPBConsignment) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{String(value || "")}</span>
          {value > 0 && (
            <Badge variant="outline" className="text-xs">
              {row.batches?.length || 0} details
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'serialNumberCount',
      label: 'Serial Numbers',
      render: (value: unknown) => (
        <span className="font-semibold text-green-600">{Number(value || 0).toLocaleString()}</span>
      )
    },
    {
      key: 'shipmentSSCCCount',
      label: 'Shipment SSCCs',
      render: (value: unknown) => (
        <span className="font-mono text-xs text-indigo-600">{String(value || "")}</span>
      )
    },
    {
      key: 'packageSSCCCount',
      label: 'Package SSCCs',
      render: (value: unknown) => (
        <span className="font-mono text-xs text-indigo-600">{String(value || "")}</span>
      )
    },
    {
      key: 'caseSSCCCount',
      label: 'Case SSCCs',
      render: (value: unknown) => (
        <span className="font-mono text-xs text-indigo-600">{String(value || "")}</span>
      )
    },
    {
      key: 'totalQuantity',
      label: 'Total Qty',
      render: (value: unknown) => (
        <span className="font-semibold">{Number(value || 0).toLocaleString()}</span>
      )
    },
    {
      key: 'shipmentDate',
      label: 'Shipment Date',
      render: (value: unknown) => new Date(String(value)).toLocaleDateString()
    },
    {
      key: 'eventTimestamp',
      label: 'Received At',
      render: (value: unknown) => (
        <span className="text-xs">{new Date(String(value)).toLocaleString()}</span>
      )
    },
  ];

  const renderExpandedContent = (consignment: PPBConsignment) => {
    if (!expandedRows.has(consignment.id)) return null;

    return (
      <tr>
        <td colSpan={columns.length} className="bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Batch Details Section */}
            {consignment.batches && consignment.batches.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Batch Details ({consignment.batches.length} batches)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {consignment.batches.map((batch: PPBBatchDetail) => (
                    <Card key={batch.id} className="p-4">
                      <CardContent className="p-0">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500">Batch Number</label>
                            <p className="font-mono font-semibold text-sm">{batch.batchNumber}</p>
                          </div>
                          {batch.product && (
                            <div>
                              <label className="text-xs font-medium text-gray-500">Product</label>
                              <p className="text-sm font-medium">{batch.product.brandDisplayName || batch.product.brandName}</p>
                              <p className="text-xs text-gray-500 font-mono">GTIN: {batch.product.gtin}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-500">Quantity</label>
                              <p className="text-sm font-semibold">{batch.quantity?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500">Serial Numbers</label>
                              <p className="text-sm font-semibold text-green-600">{batch.serialNumberCount.toLocaleString()}</p>
                            </div>
                          </div>
                          {batch.expiryDate && (
                            <div>
                              <label className="text-xs font-medium text-gray-500">Expiry Date</label>
                              <p className="text-sm">{new Date(batch.expiryDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* SSCC Hierarchy Section */}
            {consignment.ssccHierarchy && consignment.ssccHierarchy.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Barcode className="w-5 h-5" />
                  SSCC Hierarchy (Shipment → Package → Case → Batch → GTIN)
                </h3>
                <div className="bg-white rounded-lg border p-4 space-y-6">
                  {consignment.ssccHierarchy.map((shipment, shipmentIdx) => (
                    <div key={shipmentIdx} className="border-l-2 border-blue-300 pl-4 space-y-4">
                      {/* Shipment Level */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 min-w-[200px]">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Shipment</span>
                          <span className="font-mono text-xs ml-2">{shipment.shipmentSSCC}</span>
                        </div>
                        {shipment.packages.length > 0 && (
                          <div className="text-gray-400 text-lg">→</div>
                        )}
                      </div>

                      {/* Package Level */}
                      {shipment.packages.map((pkg, pkgIdx) => (
                        <div key={pkgIdx} className="ml-8 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200 min-w-[200px]">
                              <Package className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium">Package</span>
                              <span className="font-mono text-xs ml-2">{pkg.packageSSCC}</span>
                            </div>
                            {pkg.cases.length > 0 && (
                              <div className="text-gray-400 text-lg">→</div>
                            )}
                          </div>

                          {/* Case Level */}
                          {pkg.cases.map((caseItem, caseIdx) => (
                            <div key={caseIdx} className="ml-8 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200 min-w-[200px]">
                                  <Layers className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium">Case</span>
                                  <span className="font-mono text-xs ml-2">{caseItem.caseSSCC}</span>
                                </div>
                                {caseItem.batches.length > 0 && (
                                  <div className="text-gray-400 text-lg">→</div>
                                )}
                              </div>

                              {/* Batch/GTIN Level */}
                              {caseItem.batches.length > 0 && (
                                <div className="ml-8 space-y-2">
                                  {caseItem.batches.map((batch, batchIdx) => (
                                    <div key={batchIdx} className="flex items-center gap-3">
                                      <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 min-w-[300px]">
                                        <Box className="w-4 h-4 text-orange-600" />
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">Batch:</span>
                                            <span className="font-mono text-xs">{batch.batchNumber}</span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-600">GTIN:</span>
                                            <span className="font-mono text-xs text-purple-600">{batch.gtin}</span>
                                          </div>
                                          <div className="text-xs text-gray-600 mt-1">
                                            {batch.productName} (Qty: {batch.quantity.toLocaleString()})
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  No SSCC hierarchy data available. This consignment may not have shipments linked yet, or shipments need to be created and linked to this consignment.
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  Hierarchy will appear once shipments are created and linked to this consignment by matching shipment dates.
                </p>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manufacturer Consignments</h1>
          <p className="text-gray-600 mt-1">
            View your consignments. Batches are included within each consignment. 
            Only consignments for your organization are displayed here.
            {/* FUTURE: Will add "Submit to PPB" button for pre-approval workflow - see CONSIGNMENT_APPROVAL_WORKFLOW_BACKLOG.md */}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Consignments</p>
                <p className="text-2xl font-bold">{stats.totalConsignments}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Batches</p>
                <p className="text-2xl font-bold">{stats.totalBatches}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Box className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Serial Numbers</p>
                <p className="text-2xl font-bold">{stats.totalSerialNumbers.toLocaleString()}</p>
              </div>
              <Barcode className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto w-full">
          <table className="w-full" style={{ minWidth: '1400px' }}>
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  Loading consignments...
                </td>
              </tr>
            ) : consignments.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No consignments found
                </td>
              </tr>
            ) : (
              consignments.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRow(row.id)}
                  >
                    {columns.map((col) => {
                      const value = (row as any)[col.key];
                      return (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm">
                          {/* @ts-ignore */}
                          {col.render ? col.render(value, row as PPBConsignment) : value}
                        </td>
                      );
                    })}
                  </tr>
                  {renderExpandedContent(row)}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

    </div>
  );
}
