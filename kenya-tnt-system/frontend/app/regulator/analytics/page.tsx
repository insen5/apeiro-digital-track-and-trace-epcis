'use client';

import { useState, useEffect } from 'react';
import { regulatorApi, Analytics } from '@/lib/api/regulator';
import ProductBarChart from '@/components/chart/ProductBarChart';
import MonthlyEarningsChart from '@/components/chart/MonthlyEarningsChart';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await regulatorApi.analytics.getDashboard();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-8">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Products</h3>
          <p className="text-2xl font-bold text-blue-600">{analytics.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Batches</h3>
          <p className="text-2xl font-bold text-green-600">{analytics.totalBatches}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Shipments</h3>
          <p className="text-2xl font-bold text-purple-600">{analytics.totalShipments}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Recalls</h3>
          <p className="text-2xl font-bold text-red-600">{analytics.activeRecalls}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Expired Batches</h3>
          <p className="text-3xl font-bold text-orange-600">{analytics.expiredBatches}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Shipments by Status</h3>
          <div className="space-y-2">
            {Object.entries(analytics.shipmentsByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="text-gray-600">{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Product Distribution</h3>
          <ProductBarChart />
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
          <MonthlyEarningsChart />
        </div>
      </div>
    </div>
  );
}

