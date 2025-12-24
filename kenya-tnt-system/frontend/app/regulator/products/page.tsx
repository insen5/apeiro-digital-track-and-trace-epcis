'use client';

import { useState, useEffect, useMemo } from 'react';
import { regulatorApi, Product } from '@/lib/api/regulator';
import { GenericTable } from '@/components/GenericTable';
import { Input } from '@/components/ui/input';
import { Package, Search, CheckCircle2, XCircle, ChevronLeft, ChevronRight, FileBarChart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import QualityAuditHistory from '@/components/shared/QualityAuditHistory';
import QualityTrendChart from '@/components/shared/QualityTrendChart';
import SyncStatus from '@/components/shared/SyncStatus';
import ImprovedQualityAuditTab from '@/components/shared/ImprovedQualityAuditTab';
import { productQualityAudit } from '@/lib/api/quality-audit';
import { AUDIT_CONFIGS } from '@/lib/types/quality-audit';

interface ProductWithStats extends Product {
  batchCount?: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [kemlFilter, setKemlFilter] = useState<'all' | 'on-keml' | 'not-on-keml'>('all');
  const [levelOfUseFilter, setLevelOfUseFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('catalogue');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Backend data quality report
  const [backendQualityReport, setBackendQualityReport] = useState<any>(null);
  const [qualityReportLoading, setQualityReportLoading] = useState(false);

  useEffect(() => {
    loadProducts();
    loadDataQualityReport();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await regulatorApi.products.getAll();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadDataQualityReport = async () => {
    try {
      setQualityReportLoading(true);
      const data = await regulatorApi.products.getDataQualityReport();
      setBackendQualityReport(data);
    } catch (err: any) {
      console.error('Failed to load data quality report:', err);
    } finally {
      setQualityReportLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await regulatorApi.products.delete(id);
      loadProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    }
  };

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productName = product.brandDisplayName || product.genericDisplayName || product.brandName || '';
      const brandName = product.brandName || '';
      const genericName = product.genericName || '';
      const genericDisplayName = product.genericDisplayName || '';
      const gtin = product.gtin || '';
      
      const matchesSearch =
        productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        genericDisplayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gtin.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Default to enabled if isEnabled is not present
      const isEnabled = product.isEnabled !== undefined ? product.isEnabled : true;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && isEnabled) ||
        (statusFilter === 'disabled' && !isEnabled);

      // KEML filter
      const matchesKeml =
        kemlFilter === 'all' ||
        (kemlFilter === 'on-keml' && product.kemlIsOnKeml) ||
        (kemlFilter === 'not-on-keml' && !product.kemlIsOnKeml);

      // Level of use filter
      const matchesLevelOfUse =
        levelOfUseFilter === 'all' ||
        (levelOfUseFilter === 'null' && !product.levelOfUse) ||
        product.levelOfUse === levelOfUseFilter;

      // Category filter
      const matchesCategory =
        categoryFilter === 'all' ||
        (categoryFilter === 'null' && !product.category) ||
        product.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesKeml && matchesLevelOfUse && matchesCategory;
    });
  }, [products, searchTerm, statusFilter, kemlFilter, levelOfUseFilter, categoryFilter]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, kemlFilter, levelOfUseFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startItem = filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, filteredProducts.length);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = products.length;
    const enabled = products.filter(p => p.isEnabled !== undefined ? p.isEnabled : true).length;
    const disabled = total - enabled;
    return { total, enabled, disabled };
  }, [products]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate distribution metrics for analysis tab
  const distributionMetrics = useMemo(() => {
    const total = products.length;
    
    // Basic counts
    const withGtin = products.filter(p => p.gtin && p.gtin.trim() !== '').length;
    const withGenericName = products.filter(p => p.genericName || p.genericDisplayName).length;
    const withBrandName = products.filter(p => p.brandName || p.brandDisplayName).length;
    const withManufacturer = products.filter(p => p.manufacturers && p.manufacturers.length > 0).length;
    
    // KEML status
    const onKeml = products.filter(p => p.kemlIsOnKeml).length;
    const notOnKeml = total - onKeml;
    
    // Category breakdown
    const categoryCounts = products.reduce((acc, p) => {
      const category = p.category || 'Not Specified';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Level of use distribution
    const levelCounts = products.reduce((acc, p) => {
      const level = p.levelOfUse || 'Not Specified';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total,
      withGtin,
      withGenericName,
      withBrandName,
      withManufacturer,
      onKeml,
      notOnKeml,
      categoryCounts,
      levelCounts,
    };
  }, [products]);

  const columns = [
    {
      key: 'id',
      label: 'ID',
      className: 'w-20',
      render: (value: unknown) => (
        <span className="font-mono text-sm text-muted-foreground">#{value}</span>
      ),
    },
    {
      key: 'brandDisplayName',
      label: 'Product',
      className: 'min-w-[200px]',
      render: (value: string, row: ProductWithStats) => (
        <div className="space-y-1">
          {/* Brand Display Name */}
          {row.brandDisplayName && (
            <div className="font-medium text-sm text-foreground break-words">
              {row.brandDisplayName}
            </div>
          )}
          {/* Brand Name */}
          <div className="text-sm text-muted-foreground break-words">
            {row.brandName}
          </div>
          {/* Strength and Form */}
          {row.strengthAmount && (
            <div className="text-sm text-muted-foreground break-words">
              {row.strengthAmount} {row.strengthUnit || ''} • {row.formDescription || ''}
              {row.routeDescription && ` • ${row.routeDescription}`}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Type',
      className: 'min-w-[120px]',
      render: (value: string, row: ProductWithStats) => {
        const categoryLabels: Record<string, string> = {
          medicine: 'Medicine',
          supplement: 'Supplement',
          medical_device: 'Medical Device',
          cosmetic: 'Cosmetic',
        };
        
        const categoryColors: Record<string, string> = {
          medicine: 'bg-blue-100 text-blue-700',
          supplement: 'bg-green-100 text-green-700',
          medical_device: 'bg-purple-100 text-purple-700',
          cosmetic: 'bg-pink-100 text-pink-700',
        };

        if (row.category) {
          return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${categoryColors[row.category] || 'bg-gray-100 text-gray-700'}`}>
              {categoryLabels[row.category] || row.category}
            </span>
          );
        }
        return <span className="text-sm text-muted-foreground italic">—</span>;
      },
    },
    {
      key: 'genericDisplayName',
      label: 'Generic Display Name',
      className: 'min-w-[200px]',
      render: (value: string, row: ProductWithStats) => (
        <div className="text-sm text-foreground break-words whitespace-normal">
          {row.genericDisplayName || (
            <span className="text-muted-foreground italic">Not available</span>
          )}
        </div>
      ),
    },
    {
      key: 'gtin',
      label: 'GTIN / PPB Code',
      className: 'min-w-[150px]',
      render: (value: string, row: ProductWithStats) => (
        <div className="space-y-0.5">
          {value ? (
            <div className="font-mono text-sm break-words">{value}</div>
          ) : (
            <span className="text-sm text-muted-foreground italic">N/A</span>
          )}
          {row.ppbRegistrationCode && (
            <div className="text-sm text-muted-foreground break-words">
              PPB: {row.ppbRegistrationCode}
            </div>
          )}
          {row.etcdProductId && (
            <div className="text-sm text-muted-foreground break-words">
              ETCD: {row.etcdProductId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'kemlStatus',
      label: 'KEML / Level',
      className: 'min-w-[120px]',
      render: (value: string, row: ProductWithStats) => (
        <div className="space-y-1">
          {row.kemlIsOnKeml && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-sm font-medium bg-blue-100 text-blue-700">
              KEML
            </span>
          )}
          {row.levelOfUse && (
            <div className="text-sm text-muted-foreground break-words">
              Level: {row.levelOfUse}
            </div>
          )}
          {row.formularyIncluded && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-sm bg-green-100 text-green-700">
              Formulary
            </span>
          )}
          {!row.kemlIsOnKeml && !row.levelOfUse && !row.formularyIncluded && (
            <span className="text-sm text-muted-foreground italic">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'manufacturers',
      label: 'Manufacturers',
      className: 'min-w-[150px]',
      render: (value: any, row: ProductWithStats) => (
        <div>
          {row.manufacturers && row.manufacturers.length > 0 ? (
            <div className="space-y-0.5">
              {row.manufacturers.slice(0, 2).map((mfg) => (
                <div key={mfg.id} className="text-sm break-words">
                  <div className="font-medium">{mfg.manufacturerName}</div>
                  <div className="text-muted-foreground">{mfg.manufacturerEntityId}</div>
                </div>
              ))}
              {row.manufacturers.length > 2 && (
                <div className="text-sm text-muted-foreground">
                  +{row.manufacturers.length - 2} more
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">N/A</span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Registered',
      className: 'w-32',
      render: (value: unknown) => (
        <span className="text-sm text-muted-foreground">{formatDate(value)}</span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all registered pharmaceutical products
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={[
          {
            id: 'catalogue',
            label: 'Product Catalogue',
            content: (
              <div className="space-y-6">{renderProductCatalogue()}</div>
            ),
          },
          {
            id: 'analysis',
            label: 'Data Analysis',
            content: (
              <div className="space-y-6">{renderDataAnalysis()}</div>
            ),
          },
          {
            id: 'data-quality',
            label: 'Data Quality Report',
            content: (
              <div className="space-y-6">{renderDataQualityReport()}</div>
            ),
          },
          {
            id: 'audit-history',
            label: 'Audit History',
            content: (
              <div className="space-y-6">
                <ImprovedQualityAuditTab
                  entityType="product"
                  apiBasePath="http://localhost:4000/api/master-data/products"
                  entityDisplayName="Product"
                />
              </div>
            ),
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );

  // Product Catalogue Tab Content
  function renderProductCatalogue() {
    return (
      <>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Products</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Active Products</p>
                  <p className="text-3xl font-bold text-green-900">{stats.enabled}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">Disabled Products</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.disabled}</p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <XCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name, brand name, generic name, or GTIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filter Row */}
              <div className="flex flex-wrap gap-3 items-center">
                {/* Status Filter */}
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground self-center">Status:</span>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('enabled')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'enabled'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter('disabled')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === 'disabled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Disabled
                  </button>
                </div>

                {/* KEML Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">KEML:</span>
                  <Select value={kemlFilter} onValueChange={(value: 'all' | 'on-keml' | 'not-on-keml') => setKemlFilter(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="on-keml">On KEML</SelectItem>
                      <SelectItem value="not-on-keml">Not on KEML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Level of Use Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Level of Use:</span>
                  <Select value={levelOfUseFilter} onValueChange={setLevelOfUseFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="1">Level 1</SelectItem>
                      <SelectItem value="2">Level 2</SelectItem>
                      <SelectItem value="3">Level 3</SelectItem>
                      <SelectItem value="4">Level 4</SelectItem>
                      <SelectItem value="5">Level 5</SelectItem>
                      <SelectItem value="null">Not Specified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category/Type Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="supplement">Supplement</SelectItem>
                      <SelectItem value="medical_device">Medical Device</SelectItem>
                      <SelectItem value="cosmetic">Cosmetic</SelectItem>
                      <SelectItem value="null">Not Specified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Loading products...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-1">No products found</p>
                <p className="text-sm">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No products have been registered yet'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <div className="min-w-full">
                  <GenericTable
                    data={paginatedProducts}
                    columns={columns}
                    actions={[
                      {
                        label: 'Delete',
                        onClick: (row) => handleDelete(row.id),
                        className: 'text-destructive hover:text-destructive/80',
                      },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>

                  {/* Page info */}
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
                    <span className="font-medium text-foreground">{endItem}</span> of{' '}
                    <span className="font-medium text-foreground">{filteredProducts.length}</span> products
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border hover:bg-muted'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* Sync Status - At Bottom */}
        <SyncStatus 
          entityType="product" 
          apiEndpoint="http://localhost:4000/api/master-data/products"
        />
      </>
    );
  }

  // Data Analysis Tab Content (simple distributions)
  function renderDataAnalysis() {
    return (
      <>
        {/* Header */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileBarChart className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-900">Product Data Analysis</h2>
                <p className="text-sm text-blue-700 mt-1">
                  Distribution and statistical overview of product catalogue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Products with GTIN</p>
                <p className="text-2xl font-bold">{distributionMetrics.withGtin}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {distributionMetrics.total > 0 ? Math.round((distributionMetrics.withGtin / distributionMetrics.total) * 100) : 0}% of total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">With Generic Name</p>
                <p className="text-2xl font-bold">{distributionMetrics.withGenericName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {distributionMetrics.total > 0 ? Math.round((distributionMetrics.withGenericName / distributionMetrics.total) * 100) : 0}% of total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">With Brand Name</p>
                <p className="text-2xl font-bold">{distributionMetrics.withBrandName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {distributionMetrics.total > 0 ? Math.round((distributionMetrics.withBrandName / distributionMetrics.total) * 100) : 0}% of total
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">With Manufacturer</p>
                <p className="text-2xl font-bold">{distributionMetrics.withManufacturer}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {distributionMetrics.total > 0 ? Math.round((distributionMetrics.withManufacturer / distributionMetrics.total) * 100) : 0}% of total
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KEML Status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">KEML Status Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">On KEML</span>
                    <span className="text-sm text-muted-foreground">{distributionMetrics.onKeml} products</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${distributionMetrics.total > 0 ? (distributionMetrics.onKeml / distributionMetrics.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {distributionMetrics.total > 0 ? Math.round((distributionMetrics.onKeml / distributionMetrics.total) * 100) : 0}%
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Not on KEML</span>
                    <span className="text-sm text-muted-foreground">{distributionMetrics.notOnKeml} products</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${distributionMetrics.total > 0 ? (distributionMetrics.notOnKeml / distributionMetrics.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-600">
                  {distributionMetrics.total > 0 ? Math.round((distributionMetrics.notOnKeml / distributionMetrics.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Product Type Distribution</h3>
            <div className="space-y-3">
              {Object.entries(distributionMetrics.categoryCounts).map(([category, count]) => (
                <div key={category} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{category.replace('_', ' ')}</span>
                      <span className="text-sm text-muted-foreground">{count} products</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          category === 'medicine' ? 'bg-blue-500' :
                          category === 'supplement' ? 'bg-green-500' :
                          category === 'medical_device' ? 'bg-purple-500' :
                          category === 'cosmetic' ? 'bg-pink-500' :
                          'bg-gray-400'
                        }`}
                        style={{
                          width: `${distributionMetrics.total > 0 ? (count / distributionMetrics.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-lg font-bold">
                    {distributionMetrics.total > 0 ? Math.round((count / distributionMetrics.total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Level of Use Distribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Level of Use Distribution</h3>
            <div className="space-y-3">
              {Object.entries(distributionMetrics.levelCounts)
                .sort(([a], [b]) => {
                  if (a === 'Not Specified') return 1;
                  if (b === 'Not Specified') return -1;
                  return Number(a) - Number(b);
                })
                .map(([level, count]) => (
                  <div key={level} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {level === 'Not Specified' ? level : `Level ${level}`}
                        </span>
                        <span className="text-sm text-muted-foreground">{count} products</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${distributionMetrics.total > 0 ? (count / distributionMetrics.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-lg font-bold">
                      {distributionMetrics.total > 0 ? Math.round((count / distributionMetrics.total) * 100) : 0}%
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  // Data Quality Report Tab Content (uses backend API)
  function renderDataQualityReport() {
    if (qualityReportLoading) {
      return (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p>Loading data quality report...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!backendQualityReport) {
      return (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No data quality report available</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const { overview, completeness, validity, distribution, issues, recommendations } = backendQualityReport;

    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-600';
      if (score >= 80) return 'text-green-500';
      if (score >= 70) return 'text-yellow-500';
      if (score >= 60) return 'text-orange-500';
      return 'text-red-500';
    };

    const getScoreGrade = (score: number) => {
      if (score >= 90) return 'A+';
      if (score >= 80) return 'A';
      if (score >= 70) return 'B';
      if (score >= 60) return 'C';
      return 'F';
    };

    // Calculate dimension scores from backend data
    const completenessScore = completeness?.completenessPercentage || 0;
    const validityScore = validity?.validityPercentage || 100;
    const consistencyScore = 100; // Backend placeholder
    const timelinessScore = overview?.timelinessScore || 0;
    const overallScore = overview?.dataQualityScore || 0;

    return (
      <>
        {/* Header */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <FileBarChart className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-purple-900">Product Data Quality Report</h2>
                <p className="text-sm text-purple-700 mt-1">
                  Comprehensive quality assessment based on Completeness, Validity, Consistency, and Timeliness
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Quality Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Overall Data Quality Score</h3>
                <p className="text-sm text-muted-foreground">
                  Weighted score: Completeness (40%) + Validity (30%) + Consistency (15%) + Timeliness (15%)
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-8">
              {/* Circular Score */}
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - overallScore / 100)}`}
                    className={`${
                      overallScore >= 80
                        ? 'text-green-500'
                        : overallScore >= 60
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    } transition-all duration-300`}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                    {Math.round(overallScore)}
                  </span>
                  <p className="text-2xl font-semibold text-gray-600">/{getScoreGrade(overallScore)}</p>
                </div>
              </div>

              {/* Score Legend */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">90-100 (A+) - Excellent</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-400"></div>
                  <span className="text-sm">80-89 (A) - Good</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">70-79 (B) - Acceptable</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                  <span className="text-sm">60-69 (C) - Needs Improvement</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">&lt;60 (F) - Critical</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Completeness</p>
                <p className={`text-3xl font-bold ${getScoreColor(completenessScore)}`}>
                  {Math.round(completenessScore)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">Weight: 40%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Validity</p>
                <p className={`text-3xl font-bold ${getScoreColor(validityScore)}`}>
                  {Math.round(validityScore)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">Weight: 30%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Consistency</p>
                <p className={`text-3xl font-bold ${getScoreColor(consistencyScore)}`}>
                  {Math.round(consistencyScore)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">Weight: 15%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Timeliness</p>
                <p className={`text-3xl font-bold ${getScoreColor(timelinessScore)}`}>
                  {Math.round(timelinessScore)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">Weight: 15%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issues Identified */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Issues Identified</h3>
            <div className="space-y-3">
              {issues && issues.length > 0 ? (
                issues.map((issue: any, idx: number) => {
                  const severityColors = {
                    high: 'bg-red-50 border-red-200 text-red-900',
                    critical: 'bg-red-50 border-red-200 text-red-900',
                    medium: 'bg-orange-50 border-orange-200 text-orange-900',
                    low: 'bg-yellow-50 border-yellow-200 text-yellow-900',
                    info: 'bg-blue-50 border-blue-200 text-blue-900',
                  };
                  const severityIcons = {
                    high: '❌ HIGH',
                    critical: '❌ CRITICAL',
                    medium: '⚠️ MEDIUM',
                    low: '⚠️ LOW',
                    info: 'ℹ️ INFO',
                  };
                  return (
                    <div key={idx} className={`flex items-start gap-3 p-3 border rounded-lg ${severityColors[issue.severity as keyof typeof severityColors] || 'bg-gray-50 border-gray-200'}`}>
                      <span className="font-bold">{severityIcons[issue.severity as keyof typeof severityIcons] || issue.severity.toUpperCase()}</span>
                  <div className="flex-1">
                        <p className="font-medium">[{issue.category}] {issue.description}</p>
                        {issue.count && <p className="text-sm mt-1">Affected records: {issue.count}</p>}
                  </div>
                </div>
                  );
                })
              ) : (
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-green-600 font-bold">✅ GOOD</span>
                  <div className="flex-1">
                    <p className="font-medium text-green-900">No critical issues detected</p>
                    <p className="text-sm text-green-700 mt-1">Data quality is within acceptable thresholds</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <ul className="space-y-2 text-sm">
              {recommendations && recommendations.length > 0 ? (
                recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                    <span>{rec}</span>
                </li>
                ))
              ) : (
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✅</span>
                  <span>Data quality is excellent. Continue monitoring with regular audits.</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Data Completeness Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Data Completeness Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Complete Records</span>
                  <span className="font-medium">{completeness?.completeRecords || 0} / {overview?.totalRecords || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missing GTIN</span>
                  <span className="font-medium text-red-600">{completeness?.missingGtin || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missing Generic Name</span>
                  <span className="font-medium text-orange-600">{completeness?.missingGenericName || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missing Brand Name</span>
                  <span className="font-medium text-orange-600">{completeness?.missingBrandName || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missing PPB Code</span>
                  <span className="font-medium text-orange-600">{completeness?.missingPpbCode || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missing Category</span>
                  <span className="font-medium">{completeness?.missingCategory || 0}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missing Manufacturer</span>
                  <span className="font-medium text-yellow-600">{completeness?.missingManufacturer || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missing Strength</span>
                  <span className="font-medium">{completeness?.missingStrength || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missing Form</span>
                  <span className="font-medium">{completeness?.missingForm || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Missing Route</span>
                  <span className="font-medium">{completeness?.missingRoute || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duplicate GTINs</span>
                  <span className="font-medium text-red-600">{validity?.duplicateGtins || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Invalid GTIN Format</span>
                  <span className="font-medium text-red-600">{validity?.invalidGtinFormat || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }
}

