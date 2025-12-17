'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MapPin, Loader2 } from 'lucide-react';
import { masterDataApi, type ProdFacilityStats } from '@/lib/api/master-data';

export default function DataAnalysisTab() {
  const [stats, setStats] = useState<ProdFacilityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await masterDataApi.prodFacilities.getStats();
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Data Analysis</h2>
        <p className="text-gray-600">Statistical analysis of production facility master data</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-700">Total Facilities</h3>
          </div>
          <p className="text-3xl font-bold">{stats?.total || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-700">Operational</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats?.operational || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {stats?.total ? Math.round((stats.operational / stats.total) * 100) : 0}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-700">Counties Covered</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {stats ? Object.keys(stats.byCounty).length : 0}
          </p>
        </div>
      </div>

      {/* By Facility Type */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Distribution by Facility Type</h3>
        <div className="space-y-3">
          {stats && Object.entries(stats.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const percentage = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={type}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{type || 'Unknown'}</span>
                    <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
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
        <h3 className="text-lg font-semibold mb-4">Distribution by Ownership</h3>
        <div className="space-y-3">
          {stats && Object.entries(stats.byOwnership)
            .sort((a, b) => b[1] - a[1])
            .map(([ownership, count]) => {
              const percentage = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={ownership}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{ownership || 'Unknown'}</span>
                    <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* By KEPH Level */}
      {stats && stats.byKephLevel && Object.keys(stats.byKephLevel).filter(k => k !== 'Unknown').length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Distribution by KEPH Level</h3>
          <p className="text-sm text-gray-600 mb-4">
            Kenya Essential Package for Health (KEPH) classification levels 2-6
          </p>
          <div className="space-y-3">
            {Object.entries(stats.byKephLevel)
              .filter(([level]) => level !== 'Unknown')
              .sort((a, b) => {
                // Sort by level number
                const levelA = a[0].match(/\d+/)?.[0] || '0';
                const levelB = b[0].match(/\d+/)?.[0] || '0';
                return parseInt(levelA) - parseInt(levelB);
              })
              .map(([level, count]) => {
                const percentage = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div key={level}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{level}</span>
                      <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
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
          <div className="mt-4 text-sm text-gray-500 bg-blue-50 p-3 rounded">
            <strong>Note:</strong> {Object.entries(stats.byKephLevel).find(([k]) => k === 'Unknown')?.[1] || 0} facilities without KEPH level classification
          </div>
        </div>
      )}

      {/* All Counties */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">All Counties by Facility Count</h3>
        <div className="space-y-3">
          {stats && Object.entries(stats.byCounty)
            .sort((a, b) => b[1] - a[1])
            .map(([county, count]) => {
              const percentage = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={county}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{county}</span>
                    <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
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
