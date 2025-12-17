'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Loader2, 
  Building2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Globe,
  Clock,
  Layers
} from 'lucide-react';
import { masterDataApi, type UatFacilityStats } from '@/lib/api/master-data';

export default function DataAnalysisTab() {
  const [stats, setStats] = useState<UatFacilityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await masterDataApi.uatFacilities.getStats();
        setStats(response);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const glnCoverage = stats?.total ? ((stats.withGLN / stats.total) * 100).toFixed(1) : 0;
  const operationalPercentage = stats?.total ? Math.round((stats.operational / stats.total) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Data Analysis</h2>
        <p className="text-gray-600">Comprehensive statistical analysis of facility master data</p>
      </div>

      {/* Last Sync Info */}
      {stats?.lastSync && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Last synchronized</p>
            <p className="text-sm text-blue-700">
              {new Date(stats.lastSync).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Overview Stats - Expanded to 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-700">Total Facilities</h3>
          </div>
          <p className="text-3xl font-bold">{stats?.total.toLocaleString() || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-700">Operational</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats?.operational.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {operationalPercentage}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-700">Counties</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {stats ? Object.keys(stats.byCounty).length : 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Geographic coverage
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6 text-indigo-600" />
            <h3 className="font-semibold text-gray-700">GLN Coverage</h3>
          </div>
          <p className="text-3xl font-bold text-indigo-600">{glnCoverage}%</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats?.withGLN.toLocaleString() || 0} of {stats?.total.toLocaleString() || 0} facilities
          </p>
        </div>
      </div>

      {/* Operational Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-700" />
          Operational Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats?.operational.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600">Operational Facilities</p>
              <p className="text-xs text-gray-500">{operationalPercentage}% of total</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-red-100 rounded-full p-3">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {stats?.nonOperational.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600">Non-Operational Facilities</p>
              <p className="text-xs text-gray-500">{100 - operationalPercentage}% of total</p>
            </div>
          </div>
        </div>
      </div>

      {/* GLN Assignment Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-700" />
          GLN Assignment Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {stats?.withGLN.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600">Facilities with GLN</p>
              <p className="text-xs text-gray-500">{glnCoverage}% coverage</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 rounded-full p-3">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {stats?.withoutGLN.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-600">Facilities without GLN</p>
              <p className="text-xs text-gray-500">Requires assignment</p>
            </div>
          </div>
        </div>
      </div>

      {/* KEPH Level Distribution */}
      {stats && Object.keys(stats.byKephLevel).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-700" />
            Distribution by KEPH Level
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byKephLevel)
              .sort((a, b) => {
                // Sort by KEPH level number
                const numA = parseInt(a[0].replace(/[^0-9]/g, '')) || 0;
                const numB = parseInt(b[0].replace(/[^0-9]/g, '')) || 0;
                return numA - numB;
              })
              .map(([level, count]) => {
                const percentage = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={level}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {level || 'Unknown'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {count.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* By Facility Type */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-700" />
          Distribution by Facility Type
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {stats && Object.entries(stats.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const percentage = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{type || 'Unknown'}</span>
                    <span className="text-sm text-gray-600">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* By Ownership */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-700" />
          Distribution by Ownership
        </h3>
        <div className="space-y-3">
          {stats && Object.entries(stats.byOwnership)
            .sort((a, b) => b[1] - a[1])
            .map(([ownership, count]) => {
              const percentage = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={ownership}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{ownership || 'Unknown'}</span>
                    <span className="text-sm text-gray-600">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* All Counties */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-700" />
          Geographic Distribution by County
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          All {stats ? Object.keys(stats.byCounty).length : 0} counties ranked by facility count
        </p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {stats && Object.entries(stats.byCounty)
            .sort((a, b) => b[1] - a[1])
            .map(([county, count], index) => {
              const percentage = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={county}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {index + 1}. {county}
                    </span>
                    <span className="text-sm text-gray-600">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
