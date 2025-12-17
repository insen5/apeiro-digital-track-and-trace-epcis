'use client';

import { useState, useEffect } from 'react';
import { Loader2, Users, MapPin, Award, AlertCircle } from 'lucide-react';
import { masterDataApi, type PractitionerStats } from '@/lib/api/master-data';

export default function DataAnalysisTab() {
  const [stats, setStats] = useState<PractitionerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await masterDataApi.practitioners.getStats();
      setStats(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics');
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold text-red-900">Error</div>
          <div className="text-sm text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const topCadres = Object.entries(stats.byCadre)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const topCounties = Object.entries(stats.byCounty)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-green-600" />
            <div className="text-sm text-gray-600">Total Practitioners</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.total.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-blue-600" />
            <div className="text-sm text-gray-600">Cadres</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Object.keys(stats.byCadre).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-6 h-6 text-purple-600" />
            <div className="text-sm text-gray-600">Counties</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Object.keys(stats.byCounty).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-orange-600" />
            <div className="text-sm text-gray-600">License Statuses</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Object.keys(stats.byLicenseStatus).length}
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Cadres */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Top 10 Cadres
          </h3>
          <div className="space-y-3">
            {topCadres.map(([cadre, count], index) => {
              const percentage = (count / stats.total) * 100;
              return (
                <div key={cadre}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900">{cadre}</span>
                    <span className="text-gray-600 font-medium">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Counties */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            Top 10 Counties
          </h3>
          <div className="space-y-3">
            {topCounties.map(([county, count]) => {
              const percentage = (count / stats.total) * 100;
              return (
                <div key={county}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900">{county}</span>
                    <span className="text-gray-600 font-medium">
                      {count.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* License Status Distribution */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600" />
          License Status Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.byLicenseStatus)
            .sort(([, a], [, b]) => b - a)
            .map(([status, count]) => {
              const percentage = (count / stats.total) * 100;
              return (
                <div key={status} className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">{status}</div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {count.toLocaleString()}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {percentage.toFixed(1)}% of total
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
