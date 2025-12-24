/**
 * Generic Quality Audit Tab Component
 * Provides enriched quality audit dashboard with:
 * - Quality trend chart (30 days)
 * - Key metrics cards
 * - Dimension breakdown (4 dimensions)
 * - Top 5 issues
 * - Enhanced audit history
 * 
 * Works across all master data entities (Products, Premises, Facilities, Practitioners)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Database, 
  CheckCircle, 
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
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
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface QualityAuditTabProps {
  entityType: 'product' | 'premise' | 'facility' | 'facility_prod' | 'practitioner';
  apiBasePath: string; // e.g., 'http://localhost:4000/api/master-data/products'
  entityDisplayName: string; // e.g., 'Product'
}

interface TopIssue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  count: number;
  percentage?: number;
  impact?: string;
  action?: string;
}

interface EnrichedAuditData {
  entity: {
    type: string;
    displayName: string;
    totalRecords: number;
  };
  latestAudit: any;
  trend: {
    dates: string[];
    scores: number[];
  };
  dimensionBreakdown: {
    completeness: number;
    validity: number;
    consistency: number;
    timeliness: number;
  };
  topIssues: TopIssue[];
  history: any[];
}

export default function GenericQualityAuditTab({
  entityType,
  apiBasePath,
  entityDisplayName,
}: QualityAuditTabProps) {
  const [enrichedData, setEnrichedData] = useState<EnrichedAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 5;

  useEffect(() => {
    loadEnrichedData();
  }, [apiBasePath]);

  const loadEnrichedData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBasePath}/quality-audit/enriched?days=30`);
      if (!response.ok) throw new Error('Failed to load enriched audit data');
      const data = await response.json();
      setEnrichedData(data);
    } catch (error) {
      console.error('Failed to load enriched audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAudit = async () => {
    try {
      setCreating(true);
      // Call the appropriate create audit endpoint based on entity type
      const createEndpoint = `${apiBasePath}/quality-audit`;
      await fetch(createEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggeredBy: 'manual',
          notes: `Manual audit from ${entityDisplayName} dashboard`,
        }),
      });
      await loadEnrichedData();
    } catch (error) {
      console.error('Failed to create audit:', error);
      alert('Failed to create audit. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!enrichedData) {
    return (
      <div className="text-center py-12 text-gray-500">
        No audit data available. Please generate a quality audit first.
      </div>
    );
  }

  const { entity, latestAudit, trend, dimensionBreakdown, topIssues, history } = enrichedData;

  // Prepare chart data
  const chartData = {
    labels: trend.dates,
    datasets: [
      {
        label: 'Quality Score',
        data: trend.scores,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Quality Score: ${context.parsed.y}/100`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 0,
        max: 100,
        ticks: {
          callback: (value: any) => `${value}`,
        },
      },
    },
  };

  // Pagination for history
  const totalHistoryPages = Math.ceil(history.length / historyPerPage);
  const startIdx = (historyPage - 1) * historyPerPage;
  const paginatedHistory = history.slice(startIdx, startIdx + historyPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {entityDisplayName} Data Quality Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive quality assessment across 4 dimensions
          </p>
        </div>
        <button
          onClick={createAudit}
          disabled={creating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {creating ? 'Creating...' : 'Create Audit Snapshot'}
        </button>
      </div>

      {/* Quality Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quality Trend (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            {trend.scores.length >= 2 && (
              <span className={trend.scores[trend.scores.length - 1] >= trend.scores[0] ? 'text-green-600' : 'text-red-600'}>
                {trend.scores[trend.scores.length - 1] >= trend.scores[0] ? '✅ Improving' : '⚠️ Declining'} trend: 
                {' '}{Math.abs(trend.scores[trend.scores.length - 1] - trend.scores[0]).toFixed(1)} points over 30 days
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold">{(entity.totalRecords ?? 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{entityDisplayName}s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Complete Records</p>
                <p className="text-2xl font-bold">
                  {(latestAudit.completeRecords ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {(latestAudit.completenessPercentage ?? 0).toFixed(1)}% complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Quality Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(latestAudit.overallQualityScore ?? 0)}`}>
                  {(latestAudit.overallQualityScore ?? 0).toFixed(1)}/100
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Grade: {(latestAudit.overallQualityScore ?? 0) >= 90 ? 'A+' : (latestAudit.overallQualityScore ?? 0) >= 80 ? 'A' : (latestAudit.overallQualityScore ?? 0) >= 70 ? 'B' : (latestAudit.overallQualityScore ?? 0) >= 60 ? 'C' : 'F'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Audit</p>
                <p className="text-lg font-bold">
                  {new Date(latestAudit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(latestAudit.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dimension Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Dimensions Breakdown</CardTitle>
          <p className="text-sm text-gray-500">
            Showing how each dimension contributes to overall score
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(dimensionBreakdown).map(([dimension, score]) => {
            const weights = {
              completeness: 40,
              validity: 30,
              consistency: 15,
              timeliness: 15,
            };
            const weight = weights[dimension as keyof typeof weights] || 0;
            const safeScore = score ?? 0;
            
            return (
              <div key={dimension}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium capitalize">
                    {dimension} ({weight}% weight)
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(safeScore)}`}>
                    {safeScore.toFixed(0)}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getScoreBgColor(safeScore)}`}
                    style={{ width: `${safeScore}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Top Data Quality Issues
          </CardTitle>
          <p className="text-sm text-gray-500">
            Prioritized by severity and impact
          </p>
        </CardHeader>
        <CardContent>
          {topIssues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ✅ No significant issues detected! Data quality is excellent.
            </div>
          ) : (
            <div className="space-y-4">
              {topIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getSeverityIcon(issue.severity)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold uppercase text-xs">
                          {issue.severity} Priority - {issue.category}
                        </span>
                        <span className="text-sm font-bold">
                          {(issue.count ?? 0).toLocaleString()} ({(issue.percentage ?? 0).toFixed(2)}%)
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2">{issue.description}</p>
                      {issue.impact && (
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Impact:</strong> {issue.impact}
                        </p>
                      )}
                      {issue.action && (
                        <p className="text-xs text-gray-600">
                          <strong>Action:</strong> {issue.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Audit History */}
      <Card>
        <CardHeader>
          <CardTitle>Audit History (Last 20 Audits)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complete %</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dimensions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedHistory.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">#{audit.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(audit.date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${getScoreColor(audit.overallQualityScore)}`}>
                        {audit.overallQualityScore.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{audit.completenessPercentage.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      C:{dimensionBreakdown.completeness.toFixed(0)} V:{dimensionBreakdown.validity.toFixed(0)}{' '}
                      C:{dimensionBreakdown.consistency.toFixed(0)} T:{dimensionBreakdown.timeliness.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalHistoryPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIdx + 1} to {Math.min(startIdx + historyPerPage, history.length)} of {history.length} audits
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">
                  Page {historyPage} of {totalHistoryPages}
                </span>
                <button
                  onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                  disabled={historyPage === totalHistoryPages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




