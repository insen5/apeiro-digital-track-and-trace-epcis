'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { regulatorApi } from '@/lib/api/regulator';
import { PPBConsignment, PPBBatchDetail } from '@/lib/api/manufacturer'; // Reuse types from manufacturer
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { showToast } from '@/lib/toast';
import { FileText, Upload, Package, Box, Barcode, ChevronDown, ChevronRight, Truck, Layers } from 'lucide-react';

export default function PPBBatchesPage() {
  const [consignments, setConsignments] = useState<PPBConsignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadConsignments();
  }, []);

  const loadConsignments = async () => {
    setLoading(true);
    try {
      const data = await regulatorApi.ppbBatches.getAllConsignments();
      console.log('[PPB Consignments] Loaded consignments:', {
        count: data?.length,
        firstConsignment: data?.[0] ? {
          id: data[0].id,
          consignmentID: data[0].consignmentID,
          batchCount: data[0].batchCount,
          batches: data[0].batches?.length || 0,
          hasBatches: !!data[0].batches,
          ssccHierarchy: data[0].ssccHierarchy?.length || 0,
        } : null,
      });
      setConsignments(data);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load consignments';
      showToast.error(errorMessage);
      console.error('Failed to load consignments:', error);
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

  // Handle consignment import with improved error messages
  const handleImportConsignment = async () => {
    if (!jsonInput.trim()) {
      showToast.error('Please paste JSON data');
      return;
    }

    let jsonData: any;
    try {
      jsonData = JSON.parse(jsonInput);
    } catch (parseError: any) {
      showToast.error(
        'Invalid JSON format. Please check your JSON syntax. ' +
        'Common issues: missing commas, unclosed brackets, or invalid quotes. ' +
        'Use a JSON validator to check your syntax.'
      );
      return;
    }

    // Handle array of consignments (seed file format) vs single consignment
    const consignmentsToImport = Array.isArray(jsonData) ? jsonData : [jsonData];

    try {
      setImporting(true);
      const results = [];
      const errors = [];

      // Import each consignment
      for (let i = 0; i < consignmentsToImport.length; i++) {
        const consignment = consignmentsToImport[i];
        try {
          const result = await regulatorApi.ppbBatches.importConsignment(consignment);
          results.push({
            index: i + 1,
            consignmentID: result?.consignmentID || consignment?.consignment?.consignmentID || `#${i + 1}`,
            success: true,
          });
        } catch (error: any) {
          // Extract error message more robustly
          let errorMessage = 'Unknown error';
          if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error?.toString) {
            errorMessage = error.toString();
          }
          
          const consignmentID = consignment?.consignment?.consignmentID || 
                                consignment?.header?.eventID || 
                                `Consignment #${i + 1}`;
          
          const errorDetail = {
            index: i + 1,
            consignmentID,
            error: errorMessage,
          };
          
          errors.push(errorDetail);
          
          // Log error for debugging with full error object
          console.error(`[PPB Import] Failed to import consignment ${consignmentID}:`, {
            errorMessage,
            fullError: error,
            consignment: consignment?.consignment?.consignmentID || consignment?.header?.eventID,
          });
        }
      }

      // Show results - always show feedback
      if (results.length > 0) {
        const successMessage = results.length === 1
          ? `Consignment "${results[0].consignmentID}" imported successfully!`
          : `${results.length} consignments imported successfully!`;
        showToast.success(
          `${successMessage} EPCIS events generated for shipment, packages, cases, and batches.`
        );
      }

      if (errors.length > 0) {
        // Show detailed error message(s) - ALWAYS show errors
        if (errors.length === 1) {
          const err = errors[0];
          const fullErrorMessage = `Failed to import consignment "${err.consignmentID}": ${err.error}`;
          showToast.error(fullErrorMessage);
          console.error('[PPB Import] Single import error:', err);
        } else {
          // Multiple errors - show summary and details
          const errorSummary = errors.map(e => `"${e.consignmentID}": ${e.error}`).join('; ');
          showToast.error(
            `${errors.length} consignments failed to import. ${errorSummary}`,
            { duration: 10000 } // Longer duration for multiple errors
          );
          console.error('[PPB Import] Multiple import errors:', errors);
        }
      }

      // Only close modal and reload if at least one import succeeded
      if (results.length > 0) {
        setShowImportModal(false);
        setJsonInput('');
        loadConsignments(); // Reload consignments to show new ones
      } else if (errors.length > 0) {
        // All imports failed - keep modal open so user can see error and retry
        // Don't close modal or clear input - let user fix the issue
        console.warn('[PPB Import] All imports failed. Modal kept open for user to fix and retry.');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to import consignment';
      let instructions = '';

      // Parse error response for detailed messages
      if (error.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.message || errorMessage;
        
        // Provide specific instructions based on error type
        if (errorMessage.includes('duplicate key') || errorMessage.includes('already exists')) {
          instructions = 'This consignment already exists. Check the eventID in your JSON - it must be unique. ' +
            'If you need to re-import, use a different eventID or delete the existing consignment first.';
        } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
          instructions = 'Your JSON is missing required fields. Check that your JSON includes: ' +
            'header.eventID, header.eventType, header.eventTimestamp, consignment.consignmentID, ' +
            'and consignment.items array with at least one item.';
        } else if (errorMessage.includes('GTIN') || errorMessage.includes('product')) {
          instructions = 'Product/GTIN not found. Ensure the GTIN in your JSON matches a product in the system. ' +
            'You may need to add the product to the catalog first.';
        } else if (errorMessage.includes('GLN') || errorMessage.includes('manufacturer')) {
          instructions = 'Manufacturer GLN/PPBID not found. Ensure the manufacturer exists in the system ' +
            'and the GLN/PPBID in your JSON matches the registered manufacturer.';
        } else if (errorMessage.includes('EPCIS') || errorMessage.includes('event')) {
          instructions = 'EPCIS event generation failed. Check that OpenEPCIS is running and accessible. ' +
            'Verify network connectivity and OpenEPCIS service status.';
        } else if (errorMessage.includes('constraint') || errorMessage.includes('unique')) {
          instructions = 'Database constraint violation. This usually means duplicate data. ' +
            'Check for duplicate SSCCs, batch numbers, or case labels in your JSON. ' +
            'Each item must have a unique identifier.';
        } else {
          instructions = 'Check the backend logs for more details. Common issues: ' +
            'network connectivity, database connection, or service unavailability.';
        }
      } else if (error.message) {
        errorMessage = error.message;
        if (error.message.includes('JSON')) {
          instructions = 'Invalid JSON format. Use a JSON validator to check syntax.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          instructions = 'Network error. Check your connection and ensure the backend is running.';
        }
      }

      showToast.error(
        `${errorMessage}${instructions ? ' ' + instructions : ''}`
        // Errors persist until dismissed (configured in toast.ts)
      );
      console.error('Consignment import error:', error);
    } finally {
      setImporting(false);
    }
  };

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
          <div className="font-mono text-sm font-semibold">{value}</div>
          <div className="text-xs text-gray-500 font-mono">{row.eventID || 'N/A'}</div>
          <div className="text-xs text-gray-600 font-mono">{row.registrationNo || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'manufacturerPPBID',
      label: 'MAH / Manufacturer',
      render: (value: string, row: PPBConsignment) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{value || 'N/A'}</div>
          {row.manufacturerGLN && (
            <div className="text-xs text-gray-500 font-mono">
              GLN: {row.manufacturerGLN}
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
      render: (value: unknown) => value && value.length > 0 ? (
        <div className="flex flex-col gap-1">
          {value.slice(0, 2).map((gtin, idx) => (
            <span key={idx} className="font-mono text-xs text-purple-600">{gtin}</span>
          ))}
          {value.length > 2 && (
            <span className="text-xs text-gray-500">+{value.length - 2} more</span>
          )}
        </div>
      ) : (
        <span className="text-gray-400 text-xs">N/A</span>
      )
    },
    {
      key: 'productCount',
      label: 'Products',
      render: (value: unknown) => (
        <span className="font-semibold">{value}</span>
      )
    },
    {
      key: 'batchCount',
      label: 'Batches',
      render: (value: number, row: PPBConsignment) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{value}</span>
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
        <span className="font-semibold text-green-600">{value.toLocaleString()}</span>
      )
    },
    {
      key: 'totalQuantity',
      label: 'Total Qty',
      render: (value: unknown) => (
        <span className="font-semibold">{value.toLocaleString()}</span>
      )
    },
    {
      key: 'shipmentDate',
      label: 'Shipment Date',
      render: (value: unknown) => new Date(value).toLocaleDateString()
    },
    {
      key: 'eventTimestamp',
      label: 'Received At',
      render: (value: unknown) => (
        <span className="text-xs">{new Date(value).toLocaleString()}</span>
      )
    },
  ];

  const renderExpandedContent = (consignment: PPBConsignment) => {
    if (!expandedRows.has(consignment.id)) return null;

    // Debug logging
    console.log('[PPB Consignments] Rendering expanded content for:', {
      consignmentID: consignment.consignmentID,
      id: consignment.id,
      batches: consignment.batches?.length || 0,
      hasBatches: !!consignment.batches,
      batchesData: consignment.batches,
      ssccHierarchy: consignment.ssccHierarchy?.length || 0,
      hasSSCCHierarchy: !!consignment.ssccHierarchy,
    });

    return (
      <tr>
        <td colSpan={columns.length} className="bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Batch Details Section */}
            {consignment.batches && consignment.batches.length > 0 ? (
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
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800">
                  ⚠️ No batch details available
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Expected {consignment.batchCount || 0} batches, but received: {consignment.batches ? `array with ${consignment.batches.length} items` : 'undefined/null'}
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  This may indicate a data loading issue. Check the browser console for details.
                </p>
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ No SSCC hierarchy data available
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  This consignment may not have shipments, packages, or cases linked yet. 
                  SSCC hierarchy is built from shipment → package → case → batch relationships.
                </p>
                {consignment.shipmentSSCCCount > 0 || consignment.packageSSCCCount > 0 || consignment.caseSSCCCount > 0 ? (
                  <p className="text-xs text-blue-600 mt-2">
                    Note: Found {consignment.shipmentSSCCCount} shipments, {consignment.packageSSCCCount} packages, {consignment.caseSSCCCount} cases, 
                    but hierarchy structure is not available.
                  </p>
                ) : null}
              </div>
            )}

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mt-4">
                <p className="text-xs font-mono text-gray-600">
                  <strong>Debug Info:</strong> ID={consignment.id}, ConsignmentID={consignment.consignmentID}, 
                  BatchCount={consignment.batchCount}, BatchesArrayLength={consignment.batches?.length || 0}, 
                  SSCCHierarchyLength={consignment.ssccHierarchy?.length || 0}
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">PPB Consignments</h1>
          <p className="text-gray-600 mt-1">
            View all consignments from all manufacturers. Each consignment contains batches, products, and full SSCC hierarchy.
          </p>
        </div>
        <Button onClick={() => setShowImportModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Import Consignment JSON
        </Button>
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

      {/* Table */}
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
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm">
                          {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                    {renderExpandedContent(row)}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Consignment Modal */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={() => {
            if (!importing) {
              setShowImportModal(false);
              setJsonInput('');
            }
          }}
          title="Import PPB Consignment Instantiation (Option A)"
          size="xl"
        >
          <div className="space-y-4">
            {importing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Importing consignment...</p>
                    <p className="text-xs text-blue-700 mt-1">Processing JSON, creating hierarchy, and generating EPCIS events. This may take a moment.</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                Paste PPB Consignment JSON:
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                disabled={importing}
                className="w-full h-96 p-3 border rounded-md font-mono text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={`Paste JSON here... Example:\n{\n  "header": {\n    "eventID": "EVT-2025-0001",\n    "eventType": "REGULATORY_INSTANTIATION",\n    "eventTimestamp": "2025-11-01T12:45:00Z",\n    "sourceSystem": "PPB",\n    "destinationSystem": "TNT"\n  },\n  "consignment": {\n    "consignmentID": "CNS-2025-98765",\n    "manufacturer": { "ppbID": "...", "gln": "..." },\n    "mah": { "ppbID": "...", "gln": "..." },\n    "items": [ ... ]\n  }\n}`}
              />
              <p className="text-xs text-gray-500 mt-2">
                This will process the consignment, create EPCIS events, and link batches. Can also be sent via Kafka topic: <code className="bg-gray-100 px-1 rounded">ppb.consignment.instantiation</code>
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportModal(false);
                  setJsonInput('');
                }}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImportConsignment} 
                disabled={!jsonInput.trim() || importing}
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </span>
                ) : (
                  'Import & Generate EPCIS Events'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

