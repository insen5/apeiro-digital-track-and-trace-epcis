'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  AlertCircle, 
  User,
  MapPin,
  Mail,
  Phone,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { masterDataApi, type Practitioner, type PractitionerStats } from '@/lib/api/master-data';
import SyncStatus from '@/components/shared/SyncStatus';

export default function PractitionerCatalogTab() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [stats, setStats] = useState<PractitionerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [cadreFilter, setCadreFilter] = useState<string>('');
  const [countyFilter, setCountyFilter] = useState<string>('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState<string>('');

  const fetchPractitioners = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await masterDataApi.practitioners.getAll(
        page, 
        limit, 
        search,
        cadreFilter,
        countyFilter,
        licenseStatusFilter
      );
      setPractitioners(response.practitioners);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch practitioners');
      console.error('Failed to fetch practitioners:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await masterDataApi.practitioners.getStats();
      setStats(response);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      await masterDataApi.practitioners.syncCatalog();
      await fetchPractitioners();
      await fetchStats();
    } catch (err: any) {
      setError(err.message || 'Failed to sync practitioners');
      console.error('Failed to sync practitioners:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchPractitioners();
  }, [page, limit, search, cadreFilter, countyFilter, licenseStatusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const getLicenseStatus = (practitioner: Practitioner) => {
    if (!practitioner.licenseValidUntil) return null;
    
    const today = new Date();
    const expiryDate = new Date(practitioner.licenseValidUntil);
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
      {/* Info Banner */}
      {stats && stats.total < 100 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-blue-900 mb-1">
              Currently showing {stats.total} practitioners
            </div>
            <div className="text-sm text-blue-800">
              To load the full practitioner catalog from PPB, click "Sync from PPB" button.
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Practitioners</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(stats.byCadre).length}
            </div>
            <div className="text-sm text-gray-600">Cadres</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(stats.byCounty).length}
            </div>
            <div className="text-sm text-gray-600">Counties</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              <SyncStatus 
                lastSynced={stats.lastSync} 
                isLoading={syncing}
              />
            </div>
            <div className="text-sm text-gray-600">Last Sync</div>
          </div>
        </div>
      )}

      {/* Search and Sync */}
      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, registration number, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sync from PPB
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-3">
        <select
          value={cadreFilter}
          onChange={(e) => {
            setCadreFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Cadres</option>
          {stats && Object.keys(stats.byCadre).sort().map((cadre) => (
            <option key={cadre} value={cadre}>
              {cadre} ({stats.byCadre[cadre]})
            </option>
          ))}
        </select>
        <select
          value={countyFilter}
          onChange={(e) => {
            setCountyFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All Counties</option>
          {stats && Object.keys(stats.byCounty).sort().map((county) => (
            <option key={county} value={county}>
              {county} ({stats.byCounty[county]})
            </option>
          ))}
        </select>
        <select
          value={licenseStatusFilter}
          onChange={(e) => {
            setLicenseStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">All License Statuses</option>
          {stats && Object.keys(stats.byLicenseStatus).sort().map((status) => (
            <option key={status} value={status}>
              {status} ({stats.byLicenseStatus[status]})
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-red-900">Error</div>
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Registration No.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cadre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">County</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">License Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {practitioners.map((practitioner) => {
                  const licenseInfo = getLicenseStatus(practitioner);
                  const StatusIcon = licenseInfo?.icon;
                  
                  return (
                    <tr key={practitioner.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900">{practitioner.fullName}</div>
                            {practitioner.facilityName && (
                              <div className="text-sm text-gray-600">{practitioner.facilityName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {practitioner.registrationNumber || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {practitioner.cadre || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {practitioner.county ? (
                          <div className="flex items-center gap-1 text-sm text-gray-900">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {practitioner.county}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {practitioner.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-900">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {practitioner.email}
                            </div>
                          )}
                          {practitioner.phoneNumber && (
                            <div className="flex items-center gap-1 text-sm text-gray-900">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {practitioner.phoneNumber}
                            </div>
                          )}
                          {!practitioner.email && !practitioner.phoneNumber && (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {licenseInfo ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${licenseInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {licenseInfo.text}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} practitioners
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 rounded-lg ${
                      page === pageNum
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
