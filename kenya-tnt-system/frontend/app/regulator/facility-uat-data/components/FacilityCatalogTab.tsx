'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Building,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Hospital
} from 'lucide-react';
import { masterDataApi, type UatFacility, type UatFacilityStats } from '@/lib/api/master-data';
import SyncStatus from '@/components/shared/SyncStatus';

export default function FacilityCatalogTab() {
  const [facilities, setFacilities] = useState<UatFacility[]>([]);
  const [stats, setStats] = useState<UatFacilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [countyFilter, setCountyFilter] = useState<string>('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>('');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('');

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await masterDataApi.uatFacilities.getAll(
        page, 
        limit, 
        search,
        countyFilter,
        facilityTypeFilter,
        ownershipFilter
      );
      setFacilities(response.facilities);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch facilities');
      console.error('Failed to fetch facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await masterDataApi.uatFacilities.getStats();
      setStats(response);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      await masterDataApi.uatFacilities.syncCatalog();
      await fetchFacilities();
      await fetchStats();
    } catch (err: any) {
      setError(err.message || 'Failed to sync facilities');
      console.error('Failed to sync facilities:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [page, limit, search, countyFilter, facilityTypeFilter, ownershipFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by facility name or code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Safaricom HIE'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={countyFilter}
            onChange={(e) => {
              setCountyFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Counties</option>
            {stats && Object.keys(stats.byCounty).map((county) => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>

          <select
            value={facilityTypeFilter}
            onChange={(e) => {
              setFacilityTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Facility Types</option>
            {stats && Object.keys(stats.byType).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={ownershipFilter}
            onChange={(e) => {
              setOwnershipFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Ownership Types</option>
            {stats && Object.keys(stats.byOwnership).map((ownership) => (
              <option key={ownership} value={ownership}>{ownership}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      {stats?.total === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-800 font-medium">No Facilities Yet</h3>
            <p className="text-blue-700 text-sm">
              Click "Sync from Safaricom HIE" to fetch facility data from the Safaricom Health Information Exchange API.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No facilities found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GLN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facilities.map((facility) => (
                    <tr key={facility.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{facility.facilityName}</div>
                          <div className="text-sm text-gray-500">
                            Code: {facility.facilityCode}
                            {facility.mflCode && ` • MFL: ${facility.mflCode}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {facility.facilityType || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-1 text-sm text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            {facility.county}
                            {facility.subCounty && `, ${facility.subCounty}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {facility.gln ? (
                          <span className="text-gray-900">{facility.gln}</span>
                        ) : (
                          <span className="text-orange-600 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {facility.operationalStatus === 'Active' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            {facility.operationalStatus || 'Unknown'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} facilities
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="items-per-page" className="text-sm text-gray-700">
                    Items per page:
                  </label>
                  <select
                    id="items-per-page"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sync Status - Shows sync history */}
      <div className="mt-8">
        <SyncStatus
          entityType="facility"
          apiEndpoint="http://localhost:4000/api/master-data/uat-facilities"
        />
      </div>
    </div>
  );
}
