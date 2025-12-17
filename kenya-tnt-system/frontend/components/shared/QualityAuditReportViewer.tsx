/**
 * Quality Audit Report Viewer - Reusable Component
 * Displays rich formatted audit reports for Products, Premises, and Facilities
 */

'use client';

import React from 'react';
import { QualityAuditSnapshot, QualityAuditConfig } from '@/lib/types/quality-audit';

interface QualityAuditReportViewerProps {
  audit: QualityAuditSnapshot;
  config: QualityAuditConfig;
  onClose: () => void;
}

export default function QualityAuditReportViewer({ audit, config, onClose }: QualityAuditReportViewerProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Audit Report #{audit.id}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="space-y-6">
            {/* Overview Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Total {config.entityDisplayName}s</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {(audit[config.totalRecordsField as keyof QualityAuditSnapshot] as number)?.toLocaleString() || 'N/A'}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Data Quality Score</div>
                <div className="text-2xl font-bold text-green-900 mt-1">
                  {Number(audit[config.scoreField as keyof QualityAuditSnapshot]) || 0}/100
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Completeness</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {Number(audit.completenessPercentage || 0).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Issues Section */}
            {audit.fullReport?.issues && audit.fullReport.issues.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Issues Detected ({audit.fullReport.issues.length})</h4>
                <div className="space-y-2">
                  {audit.fullReport.issues.map((issue: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-l-4 ${
                        issue.severity === 'high'
                          ? 'bg-red-50 border-red-500'
                          : issue.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-medium uppercase px-2 py-0.5 rounded ${
                                issue.severity === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : issue.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {issue.severity}
                            </span>
                            <span className="text-xs text-gray-500">{issue.category}</span>
                          </div>
                          <p className="text-sm text-gray-900">{issue.description}</p>
                        </div>
                        <div className="text-lg font-bold text-gray-900 ml-4">
                          {issue.count?.toLocaleString() || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {audit.fullReport?.recommendations && audit.fullReport.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Recommendations ({audit.fullReport.recommendations.length})</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {audit.fullReport.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Metadata Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Audit Metadata</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Report Date:</span>
                  <span className="ml-2 text-gray-900 font-medium">
                    {new Date(audit[config.dateField as keyof QualityAuditSnapshot] as string).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Triggered By:</span>
                  <span className="ml-2 text-gray-900 font-medium">{audit.triggeredBy || 'manual'}</span>
                </div>
                {audit.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Notes:</span>
                    <span className="ml-2 text-gray-900">{audit.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Raw JSON (Collapsible) */}
            <details className="border border-gray-200 rounded-lg">
              <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">
                View Raw JSON (for developers)
              </summary>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(audit.fullReport || audit, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
