/**
 * Shared Quality Trend Chart Component
 * Visualizes quality score changes over time
 */

'use client';

import React, { useState, useEffect } from 'react';
import { QualityTrendPoint, QualityAuditConfig } from '@/lib/types/quality-audit';
import { QualityAuditApiMethods } from '@/lib/api/quality-audit';

interface QualityTrendChartProps {
  config: QualityAuditConfig;
  auditApi: QualityAuditApiMethods;
  days?: number;
}

export default function QualityTrendChart({ config, auditApi, days = 30 }: QualityTrendChartProps) {
  const [trendData, setTrendData] = useState<QualityTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(days);

  useEffect(() => {
    loadTrend();
  }, [selectedDays]);

  const loadTrend = async () => {
    try {
      setLoading(true);
      const data = await auditApi.getTrend(selectedDays);
      setTrendData(data);
    } catch (error) {
      console.error('Failed to load quality trend:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const maxScore = 100;
  const minScore = 0;
  const chartHeight = 200;
  const chartWidth = 800;
  const padding = 40;

  const getYPosition = (score: number) => {
    const range = maxScore - minScore;
    const percentage = (score - minScore) / range;
    return chartHeight - padding - percentage * (chartHeight - 2 * padding);
  };

  const getXPosition = (index: number, total: number) => {
    const availableWidth = chartWidth - 2 * padding;
    return padding + (index / (total - 1 || 1)) * availableWidth;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (trendData.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No trend data available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create audit snapshots to see quality trends over time.
        </p>
      </div>
    );
  }

  // Generate path for line chart
  const pathData = trendData
    .map((point, index) => {
      const x = getXPosition(index, trendData.length);
      const y = getYPosition(point.score);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {config.entityDisplayName} Quality Trend
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Score changes over the last {selectedDays} days
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDays(d)}
              className={`px-3 py-1 text-sm rounded ${
                selectedDays === d
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((score) => (
            <g key={score}>
              <line
                x1={padding}
                y1={getYPosition(score)}
                x2={chartWidth - padding}
                y2={getYPosition(score)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={getYPosition(score)}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-xs fill-gray-500"
              >
                {score}
              </text>
            </g>
          ))}

          {/* Trend line */}
          <path d={pathData} fill="none" stroke="#10b981" strokeWidth="2" />

          {/* Data points */}
          {trendData.map((point, index) => (
            <g key={index}>
              <circle
                cx={getXPosition(index, trendData.length)}
                cy={getYPosition(point.score)}
                r="4"
                fill={getScoreColor(point.score)}
                className="cursor-pointer hover:r-6 transition-all"
              >
                <title>
                  {new Date(point.date).toLocaleDateString()}: {point.score}/100
                </title>
              </circle>
            </g>
          ))}

          {/* X-axis labels */}
          {trendData.map((point, index) => {
            if (index % Math.ceil(trendData.length / 8) === 0 || index === trendData.length - 1) {
              return (
                <text
                  key={index}
                  x={getXPosition(index, trendData.length)}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {new Date(point.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Good (80-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Fair (60-79)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Poor (0-59)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
