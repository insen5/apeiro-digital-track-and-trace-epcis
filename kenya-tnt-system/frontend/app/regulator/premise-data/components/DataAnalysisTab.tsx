'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Building2,
  Users,
  Calendar,
  Loader2,
  AlertCircle,
  PieChart
} from 'lucide-react';
import { masterDataApi, type DataQualityReport } from '@/lib/api/master-data';

export default function DataAnalysisTab() {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await masterDataApi.premises.getDataQualityReport();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data analysis');
      console.error('Failed to fetch analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center border border-gray-200">
        <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
        <p className="text-gray-600">Loading data analysis...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-red-800 mb-1">Failed to Load Analysis</h2>
          <p className="text-red-700">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kenya Geographic Coverage Stats */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg shadow-md border border-green-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-green-600" />
          Kenya Geographic Coverage from PPB Premise Data
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Total Unique Combinations</div>
            <div className="text-3xl font-bold text-purple-600">1,310</div>
            <div className="text-xs text-gray-500 mt-1">County→Constituency→Ward paths</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Counties</div>
            <div className="text-3xl font-bold text-blue-600">47</div>
            <div className="text-xs text-gray-500 mt-1">All Kenya counties represented</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Constituencies (Sub-Counties)</div>
            <div className="text-3xl font-bold text-green-600">289</div>
            <div className="text-xs text-gray-500 mt-1">Administrative sub-divisions</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-1">Wards</div>
            <div className="text-3xl font-bold text-orange-600">1,063</div>
            <div className="text-xs text-gray-500 mt-1">Local administrative units</div>
          </div>
        </div>
        
        {/* Top 4 Counties Detail */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="font-semibold text-gray-900 text-sm mb-1">Nairobi</div>
            <div className="text-xs text-gray-600">53 constituencies, 126 wards</div>
            <div className="text-lg font-bold text-blue-600 mt-1">2,969 premises</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="font-semibold text-gray-900 text-sm mb-1">Kiambu</div>
            <div className="text-xs text-gray-600">30 constituencies, 81 wards</div>
            <div className="text-lg font-bold text-blue-600 mt-1">1,085 premises</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="font-semibold text-gray-900 text-sm mb-1">Nakuru</div>
            <div className="text-xs text-gray-600">18 constituencies, 56 wards</div>
            <div className="text-lg font-bold text-blue-600 mt-1">544 premises</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="font-semibold text-gray-900 text-sm mb-1">Mombasa</div>
            <div className="text-xs text-gray-600">16 constituencies, 40 wards</div>
            <div className="text-lg font-bold text-blue-600 mt-1">526 premises</div>
          </div>
        </div>
        <div className="mt-3 text-center text-sm text-gray-600">
          ...and 43 more counties with complete coverage across Kenya
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="w-8 h-8 text-blue-500" />
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {report.overview.totalPremises.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Premises</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Across {report.distribution.byCounty.length} counties
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <MapPin className="w-8 h-8 text-green-500" />
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {report.distribution.byCounty.length}
              </div>
              <div className="text-sm text-gray-600">Counties</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Nationwide coverage
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-500" />
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {report.distribution.bySuperintendentCadre.length}
              </div>
              <div className="text-sm text-gray-600">Cadre Types</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Superintendent categories
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-orange-500" />
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {report.validity.validLicenses}
              </div>
              <div className="text-sm text-gray-600">Valid Licenses</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {report.validity.expiredLicenses} expired, {report.validity.expiringSoon} expiring soon
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Geographic Distribution by County - All {report.distribution.byCounty.length} Counties
          </h2>
        </div>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {report.distribution.byCounty.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-900">{item.county}</span>
                <span className="text-gray-600">{item.count.toLocaleString()} premises ({item.percentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Business Type Distribution</h2>
          </div>
          <div className="space-y-3">
            {report.distribution.byBusinessType.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{item.type}</span>
                  <span className="text-gray-600">{item.count} ({item.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ownership Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Ownership Distribution</h2>
          </div>
          <div className="space-y-3">
            {report.distribution.byOwnership.map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{item.ownership}</span>
                  <span className="text-gray-600">{item.count} ({item.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Superintendent Cadre Distribution */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">Superintendent Cadre Distribution</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.distribution.bySuperintendentCadre.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{item.cadre}</span>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{item.count}</div>
                <div className="text-xs text-gray-600">{item.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* License Status Summary */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">License Status Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {report.validity.validLicenses}
            </div>
            <div className="text-sm font-medium text-green-800">Valid Licenses</div>
            <div className="text-xs text-green-600 mt-1">
              {((report.validity.validLicenses / report.overview.totalPremises) * 100).toFixed(1)}% of total
            </div>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {report.validity.expiringSoon}
            </div>
            <div className="text-sm font-medium text-yellow-800">Expiring Soon</div>
            <div className="text-xs text-yellow-600 mt-1">Within 30 days</div>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {report.validity.expiredLicenses}
            </div>
            <div className="text-sm font-medium text-red-800">Expired Licenses</div>
            <div className="text-xs text-red-600 mt-1">Requires renewal</div>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg shadow border border-blue-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="font-semibold text-gray-900 mb-2">Top County</div>
            <div className="text-2xl font-bold text-green-600">
              {report.distribution.byCounty[0]?.county || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              {report.distribution.byCounty[0]?.count || 0} premises ({report.distribution.byCounty[0]?.percentage.toFixed(1) || 0}%)
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="font-semibold text-gray-900 mb-2">Dominant Business Type</div>
            <div className="text-2xl font-bold text-blue-600">
              {report.distribution.byBusinessType[0]?.businessType || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              {report.distribution.byBusinessType[0]?.count || 0} premises ({report.distribution.byBusinessType[0]?.percentage.toFixed(1) || 0}%)
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="font-semibold text-gray-900 mb-2">Geographic Coverage</div>
            <div className="text-2xl font-bold text-purple-600">
              {report.distribution.byCounty.length} Counties
            </div>
            <div className="text-sm text-gray-600">
              Nationwide pharmaceutical network
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

