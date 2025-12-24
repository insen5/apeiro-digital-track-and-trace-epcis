'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Info,
  TrendingUp,
  BarChart3,
  MapPin,
  Building2
} from 'lucide-react';
import { masterDataApi } from '@/lib/api/master-data';

export default function DataQualityTab() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await masterDataApi.uatFacilities.getDataQualityReport();
        setReport(response);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch quality report');
        console.error('Failed to fetch quality report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Report</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-gray-400';
    if (score >= 90) return 'bg-green-600';
    if (score >= 80) return 'bg-blue-600';
    if (score >= 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const totalFacilities = report?.overview?.totalFacilities || 0;
  const overallScore = report?.scores?.overall;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Quality Report</h2>
        <p className="text-gray-600">Comprehensive quality analysis of facility master data from Safaricom HIE</p>
      </div>

      {/* Environment Notices */}
      {totalFacilities === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">UAT Environment - No Data</h3>
              <p className="text-sm text-amber-800">
                The Safaricom HIE Facility Registry UAT environment currently contains no test data.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Data Quality Information</h3>
              <p className="text-sm text-blue-800">
                Analyzing <strong>{totalFacilities.toLocaleString()} facilities</strong> from Safaricom HIE Facility Registry.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Score Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">Overall Data Quality Score</h3>
            <p className="text-sm text-gray-600">
              Last synced: {report?.overview?.lastSync ? new Date(report.overview.lastSync).toLocaleString() : 'Never'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {totalFacilities.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Facilities</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Circular Score */}
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              {overallScore !== null && (
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallScore / 100)}`}
                  className={getScoreBg(overallScore)}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore !== null ? Math.round(overallScore) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">Quality Dimensions</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Completeness</div>
                <div className="text-xs text-gray-400 mb-1">Weight: 40%</div>
                <div className={`text-xl font-bold ${getScoreColor(report?.scores?.completeness)}`}>
                  {report?.scores?.completeness !== null ? `${Math.round(report.scores.completeness)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Validity</div>
                <div className="text-xs text-gray-400 mb-1">Weight: 30%</div>
                <div className={`text-xl font-bold ${getScoreColor(report?.scores?.validity)}`}>
                  {report?.scores?.validity !== null ? `${Math.round(report.scores.validity)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Consistency</div>
                <div className="text-xs text-gray-400 mb-1">Weight: 15%</div>
                <div className={`text-xl font-bold ${getScoreColor(report?.scores?.consistency)}`}>
                  {report?.scores?.consistency !== null ? `${Math.round(report.scores.consistency)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Timeliness</div>
                <div className="text-xs text-gray-400 mb-1">Weight: 15%</div>
                <div className={`text-xl font-bold ${getScoreColor(report?.scores?.timeliness)}`}>
                  {report?.scores?.timeliness !== null ? `${Math.round(report.scores.timeliness)}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completeness Issues */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Data Completeness Issues</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Missing MFL Code</span>
              </div>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">HIGH</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {report?.completeness?.missingMflCode || 0}
            </div>
            <div className="text-sm text-red-700 mt-1">
              {totalFacilities > 0 ? ((report?.completeness?.missingMflCode || 0) / totalFacilities * 100).toFixed(1) : 0}% of total
            </div>
          </div>

          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Missing County</span>
              </div>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">HIGH</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {report?.completeness?.missingCounty || 0}
            </div>
            <div className="text-sm text-red-700 mt-1">
              {totalFacilities > 0 ? ((report?.completeness?.missingCounty || 0) / totalFacilities * 100).toFixed(1) : 0}% of total
            </div>
          </div>

          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Missing Coordinates</span>
              </div>
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">HIGH</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {report?.completeness?.missingCoordinates || 0}
            </div>
            <div className="text-sm text-red-700 mt-1">
              {totalFacilities > 0 ? ((report?.completeness?.missingCoordinates || 0) / totalFacilities * 100).toFixed(1) : 0}% missing lat/lng
            </div>
          </div>

          <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Missing Facility Type</span>
              </div>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">MEDIUM</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {report?.completeness?.missingFacilityType || 0}
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              {totalFacilities > 0 ? ((report?.completeness?.missingFacilityType || 0) / totalFacilities * 100).toFixed(1) : 0}% of total
            </div>
          </div>

          <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Missing Ownership</span>
              </div>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">MEDIUM</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {report?.completeness?.missingOwnership || 0}
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              {totalFacilities > 0 ? ((report?.completeness?.missingOwnership || 0) / totalFacilities * 100).toFixed(1) : 0}% of total
            </div>
          </div>

          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Missing GLN</span>
              </div>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">LOW</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {report?.completeness?.missingGLN || 0}
            </div>
            <div className="text-sm text-blue-700 mt-1">
              {totalFacilities > 0 ? ((report?.completeness?.missingGLN || 0) / totalFacilities * 100).toFixed(1) : 0}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Consistency Issues */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Data Consistency Issues</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Muranga Duplicate Counties - CRITICAL ISSUE */}
          {(report?.consistency?.duplicateCountyVariations || 0) > 0 && (
            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Duplicate County Names</span>
                </div>
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded font-medium">HIGH</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {report?.consistency?.duplicateCountyVariations || 0}
              </div>
              <div className="text-sm text-orange-700 mt-2">
                <div className="font-semibold">MURANGA vs MURANG'A</div>
                <div className="mt-1">Kenya has 47 counties, but system shows 48 due to spelling variations</div>
                <div className="mt-1 font-medium">
                  {(report?.overview?.totalFacilities || 0) > 0 ? ((report?.consistency?.duplicateCountyVariations || 0) / (report?.overview?.totalFacilities || 1) * 100).toFixed(1) : 0}% of facilities affected
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Validity Issues */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Data Validity Issues</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-gray-900">Duplicate MFL Codes</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {report?.validity?.duplicateFacilityCodes || 0}
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              Data integrity issue
            </div>
          </div>

          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-900">Invalid Coordinates</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {report?.validity?.invalidCoordinates || 0}
            </div>
            <div className="text-sm text-red-700 mt-1">
              Out-of-range lat/lng
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">Data Quality Recommendations</h3>
            <ul className="text-sm text-green-800 space-y-1.5">
              {(report?.consistency?.duplicateCountyVariations || 0) > 0 && (
                <li className="flex items-start gap-2 bg-orange-50 p-2 rounded border border-orange-200">
                  <span className="text-orange-600 mt-1 font-bold">⚠</span>
                  <span className="font-medium text-orange-900">
                    <strong>URGENT:</strong> Standardize county name spelling - "MURANGA" should be "MURANG'A" (affects {report?.consistency?.duplicateCountyVariations || 0} facilities)
                  </span>
                </li>
              )}
              {(report?.validity?.invalidCoordinates || 0) > 0 && (
                <li className="flex items-start gap-2 bg-red-50 p-2 rounded border border-red-200">
                  <span className="text-red-600 mt-1 font-bold">!</span>
                  <span className="font-medium text-red-900">
                    Fix {report?.validity?.invalidCoordinates || 0} facilities with coordinates outside Kenya bounds
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Monitor data quality trends regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Implement fallback to Kenya MFL for missing data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Use audit history to track data quality improvements</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
