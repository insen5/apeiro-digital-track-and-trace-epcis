/**
 * Improved Quality Audit Tab
 * Combines the best of old UI (simplicity, view details) with new features (dimension trends)
 * 
 * Features:
 * - Overall quality trend chart (7d, 14d, 30d, 90d)
 * - 4 dimension trend mini-charts (completeness, validity, consistency, timeliness)
 * - Audit history table with "View Details" button
 * - Generic/unified across all master data entities
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ImprovedQualityAuditTabProps {
  entityType: string; // 'product', 'premise', 'facility', 'facility_prod', 'practitioner'
  apiBasePath: string; // e.g., 'http://localhost:4000/api/master-data/products'
  entityDisplayName: string; // e.g., 'Product'
}

export default function ImprovedQualityAuditTab({
  entityType,
  apiBasePath,
  entityDisplayName,
}: ImprovedQualityAuditTabProps) {
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadEnrichedData();
  }, [selectedDays]);

  const loadEnrichedData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBasePath}/quality-audit/enriched?days=${selectedDays}`);
      if (!response.ok) throw new Error('Failed to load enriched audit data');
      const data = await response.json();
      setEnrichedData(data);
    } catch (error) {
      console.error('Failed to load enriched data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAudit = async () => {
    try {
      setCreating(true);
      const response = await fetch(`${apiBasePath}/quality-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggeredBy: 'manual',
          notes: `Manual audit from ${entityDisplayName} dashboard`,
        }),
      });
      if (!response.ok) throw new Error('Failed to create audit');
      await loadEnrichedData();
    } catch (error) {
      console.error('Failed to create audit:', error);
      alert('Failed to create audit. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  if (loading || !enrichedData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const { entity, latestAudit, trend, dimensionBreakdown, history } = enrichedData;

  // Pagination
  const totalPages = Math.ceil((history?.length || 0) / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedHistory = history?.slice(startIdx, startIdx + itemsPerPage) || [];

  // Overall quality trend chart data
  const overallChartData = {
    labels: trend.dates,
    datasets: [
      {
        label: 'Overall Quality Score',
        data: trend.scores,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Dimension trend charts data (extract from history)
  const dimensionTrends = {
    completeness: history?.map((h: any) => h.dimensionBreakdown?.completeness ?? dimensionBreakdown.completeness) || [],
    validity: history?.map((h: any) => h.dimensionBreakdown?.validity ?? dimensionBreakdown.validity) || [],
    consistency: history?.map((h: any) => h.dimensionBreakdown?.consistency ?? dimensionBreakdown.consistency) || [],
    timeliness: history?.map((h: any) => h.dimensionBreakdown?.timeliness ?? dimensionBreakdown.timeliness) || [],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { stepSize: 25 },
      },
    },
  };

  const miniChartOptions = {
    ...chartOptions,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false, min: 0, max: 100 },
    },
  };

  const createMiniChartData = (data: number[], color: string) => ({
    labels: trend.dates.slice(-data.length),
    datasets: [
      {
        data: data.slice(-trend.dates.length),
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {entityDisplayName} Quality Audit History
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Track quality scores and dimensions over time
          </p>
        </div>
        <button
          onClick={createAudit}
          disabled={creating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {creating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Audit Snapshot
            </>
          )}
        </button>
      </div>

      {/* Overall Quality Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Overall Quality Trend</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Score changes over the last {selectedDays} days</p>
            </div>
            <div className="flex gap-2">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDays(d)}
                  className={`px-3 py-1 text-sm rounded ${
                    selectedDays === d ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: '250px' }}>
            <Line data={overallChartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Dimension Trend Mini-Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'completeness', label: 'Completeness', color: 'rgb(59, 130, 246)', weight: 40 },
          { key: 'validity', label: 'Validity', color: 'rgb(168, 85, 247)', weight: 30 },
          { key: 'consistency', label: 'Consistency', color: 'rgb(234, 179, 8)', weight: 15 },
          { key: 'timeliness', label: 'Timeliness', color: 'rgb(239, 68, 68)', weight: 15 },
        ].map((dim) => {
          const currentScore = dimensionBreakdown[dim.key] ?? 0;
          const previousScore = dimensionTrends[dim.key as keyof typeof dimensionTrends][dimensionTrends[dim.key as keyof typeof dimensionTrends].length - 2] ?? currentScore;

          return (
            <Card key={dim.key}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-500">{dim.label} ({dim.weight}%)</p>
                    <p className="text-2xl font-bold mt-1">{currentScore.toFixed(0)}%</p>
                  </div>
                  {getTrendIcon(currentScore, previousScore)}
                </div>
                <div style={{ height: '60px' }}>
                  <Line
                    data={createMiniChartData(dimensionTrends[dim.key as keyof typeof dimensionTrends], dim.color)}
                    options={miniChartOptions}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Audit History Table */}
      {history && history.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audit ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completeness
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Records
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Triggered By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedHistory.map((audit: any) => (
                    <tr key={audit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{audit.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(audit.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreBadge(audit.overallQualityScore ?? 0)}`}>
                          {(audit.overallQualityScore ?? 0).toFixed(0)}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(audit.completenessPercentage ?? 0).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(audit.totalRecords ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {audit.triggeredBy || 'manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setSelectedAudit(audit)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {history.length > 10 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, history.length)} of {history.length} audits
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="items-per-page" className="text-sm text-gray-700">
                      Items per page:
                    </label>
                    <select
                      id="items-per-page"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No audit history</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first quality audit snapshot.</p>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Audit Report #{selectedAudit.id}</h2>
                  <p className="text-sm text-gray-500 mt-1">{new Date(selectedAudit.date).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedAudit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Display full report JSON */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Full Report</h3>
                <pre className="text-xs overflow-x-auto">{JSON.stringify(selectedAudit.fullReport || selectedAudit, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


