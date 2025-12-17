'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Building2,
  MapPin,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { masterDataApi, type Premise, type PremiseStats, type FilterOptions } from '@/lib/api/master-data';
import SyncStatus from '@/components/shared/SyncStatus';

export default function PremiseCatalogTab() {
  const [premises, setPremises] = useState<Premise[]>([]);
  const [stats, setStats] = useState<PremiseStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('');
  const [constituencyFilter, setConstituencyFilter] = useState<string>('');
  const [wardFilter, setWardFilter] = useState<string>('');

  const fetchPremises = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await masterDataApi.premises.getAll(
        page, 
        limit, 
        search,
        undefined,
        businessTypeFilter,
        constituencyFilter,
        wardFilter
      );
      setPremises(response.premises);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch premises');
      console.error('Failed to fetch premises:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await masterDataApi.premises.getStats();
      setStats(response);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await masterDataApi.premises.getFilterOptions();
      setFilterOptions(response);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      await masterDataApi.premises.syncCatalog();
      await fetchPremises();
      await fetchStats();
      await fetchFilterOptions();
    } catch (err: any) {
      setError(err.message || 'Failed to sync premises');
      console.error('Failed to sync premises:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchPremises();
  }, [page, limit, search, businessTypeFilter, constituencyFilter, wardFilter]);

  useEffect(() => {
    fetchStats();
    fetchFilterOptions();
  }, []);

  const getLicenseStatus = (premise: Premise) => {
    if (!premise.licenseValidUntil) return null;
    
    const today = new Date();
    const expiryDate = new Date(premise.licenseValidUntil);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-600 bg-red-50', icon: XCircle, text: 'Expired' };
    } else if (daysUntilExpiry < 30) {
      return { status: 'expiring', color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle, text: `${daysUntilExpiry} days left` };
    }
    return { status: 'valid', color: 'text-green-600 bg-green-50', icon: CheckCircle, text: 'Valid' };
  };

  const totalPages = Math.ceil(total / limit);
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (page >= totalPages - 2) {
        pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(page - 2, page - 1, page, page + 1, page + 2);
      }
    }
    return pages;
  };

  return (
    <div>
      {/* Info Banner - Only show if < 100 premises (seed data only) */}
      {stats && stats.total < 100 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-blue-900 mb-1">
              Currently showing {stats.total} seed/test premises
            </div>
            <div className="text-sm text-blue-800">
              To load the full premise catalog from PPB ({'>'}1,000 premises), configure the PPB API credentials in 
              <code className="mx-1 px-2 py-0.5 bg-blue-100 rounded text-xs">.env</code>
              and click "Sync from PPB" button.
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Premises</div>
            <div className="text-2xl font-bold text-blue-600">{stats.total.toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Last Synced</div>
            <div className="text-sm font-semibold text-gray-900">
              {stats.lastSynced 
                ? new Date(stats.lastSynced).toLocaleString() 
                : 'Never'}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Top County</div>
            <div className="text-sm font-semibold text-gray-900">
              {stats.byCounty[0]?.county || 'N/A'} ({stats.byCounty[0]?.count || 0})
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Counties Covered</div>
            <div className="text-2xl font-bold text-green-600">{stats.byCounty.length}</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by premise name, county, business type, or superintendent..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from PPB'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={businessTypeFilter}
            onChange={(e) => {
              setBusinessTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="">All Business Types</option>
            {filterOptions?.businessTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={constituencyFilter}
            onChange={(e) => {
              setConstituencyFilter(e.target.value);
              setWardFilter('');
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="">All Sub-Counties (Constituencies)</option>
            {filterOptions?.constituencies.map(constituency => (
              <option key={constituency} value={constituency}>{constituency}</option>
            ))}
          </select>

          <select
            value={wardFilter}
            onChange={(e) => {
              setWardFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="">All Wards</option>
            {filterOptions?.wards.map(ward => (
              <option key={ward} value={ward}>{ward}</option>
            ))}
          </select>
        </div>

        {/* Active Filters Display */}
        {(businessTypeFilter || constituencyFilter || wardFilter) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {businessTypeFilter && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                Business: {businessTypeFilter}
                <button onClick={() => setBusinessTypeFilter('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {constituencyFilter && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                Sub-County: {constituencyFilter}
                <button onClick={() => { setConstituencyFilter(''); setWardFilter(''); }} className="hover:text-green-900">×</button>
              </span>
            )}
            {wardFilter && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                Ward: {wardFilter}
                <button onClick={() => setWardFilter('')} className="hover:text-green-900">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setBusinessTypeFilter('');
                setConstituencyFilter('');
                setWardFilter('');
              }}
              className="text-xs text-gray-600 hover:text-gray-900 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold text-red-800">Error</div>
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center border border-gray-200">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading premises...</p>
        </div>
      ) : premises.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center border border-gray-200">
          <Building2 className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {search || businessTypeFilter || constituencyFilter || wardFilter ? 'No premises found' : 'No Premises Data Yet'}
          </h2>
          <p className="text-gray-600 text-center max-w-md mb-4">
            {search || businessTypeFilter || constituencyFilter || wardFilter
              ? 'Try adjusting your search or filter criteria' 
              : 'Click "Sync from PPB" to load premise data from the PPB Catalogue API'}
          </p>
          {!search && !businessTypeFilter && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from PPB'}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Premise Name & IDs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      County / Constituency / Ward
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Type & Ownership
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Superintendent Name / Cadre / Reg#
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Status & Expiry
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GLN
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {premises.map((premise) => {
                    const licenseStatus = getLicenseStatus(premise);
                    
                    return (
                      <tr key={premise.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-900">{premise.premiseName}</div>
                              <div className="text-xs text-gray-500">ID: {premise.premiseId}</div>
                              {premise.legacyPremiseId && (
                                <div className="text-xs text-gray-400">PPB: {premise.legacyPremiseId}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{premise.county || 'N/A'}</div>
                              {premise.constituency && (
                                <div className="text-xs text-gray-600">{premise.constituency}</div>
                              )}
                              {premise.ward && (
                                <div className="text-xs text-gray-500">{premise.ward}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {premise.businessType || 'Unknown'}
                          </span>
                          {premise.ownership && (
                            <div className="text-xs text-gray-500 mt-1">{premise.ownership}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {premise.superintendentName || 'Not assigned'}
                              </div>
                              {premise.superintendentCadre && (
                                <div className="text-xs text-gray-600">{premise.superintendentCadre}</div>
                              )}
                              {premise.superintendentRegistrationNumber && (
                                <div className="text-xs text-gray-500">
                                  Reg: {premise.superintendentRegistrationNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {licenseStatus ? (
                            <div className="flex items-center gap-2">
                              <licenseStatus.icon className={`w-4 h-4 ${licenseStatus.color.split(' ')[0]}`} />
                              <div>
                                <div className={`text-sm font-medium ${licenseStatus.color.split(' ')[0]}`}>
                                  {licenseStatus.text}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(premise.licenseValidUntil!).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No license info</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {premise.gln ? (
                            <div className="text-sm font-mono text-gray-700">{premise.gln}</div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Ban className="w-4 h-4" />
                              <span className="text-xs">Not assigned</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Matching mockup */}
          <div className="mt-6 flex items-center justify-between">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total.toLocaleString()} premises
            </div>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 min-w-[2rem] rounded-md transition-colors ${
                    page === pageNum
                      ? 'bg-black text-white font-medium'
                      : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sync Status - Shows sync history */}
      <div className="mt-8">
        <SyncStatus
          entityType="premise"
          apiEndpoint="http://localhost:4000/api/master-data/premises"
        />
      </div>
    </div>
  );
}
