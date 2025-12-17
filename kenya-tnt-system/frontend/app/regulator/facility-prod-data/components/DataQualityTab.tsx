'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Info,
  FileText,
  RefreshCw,
  Database,
  Shield,
  Activity,
  Calendar,
  MapPin
} from 'lucide-react';
import { masterDataApi } from '@/lib/api/master-data';

export default function DataQualityTab() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await masterDataApi.prodFacilities.getDataQualityReport();
      setReport(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quality report');
      console.error('Failed to fetch quality report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', status: 'Excellent', color: 'text-green-600' };
    if (score >= 80) return { grade: 'B', status: 'Good', color: 'text-blue-600' };
    if (score >= 70) return { grade: 'C', status: 'Fair', color: 'text-yellow-600' };
    if (score >= 60) return { grade: 'D', status: 'Poor', color: 'text-orange-600' };
    return { grade: 'F', status: 'Critical', color: 'text-red-600' };
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-semibold text-red-800 mb-1">Failed to Load Report</h2>
          <p className="text-red-700">{error || 'Unknown error occurred'}</p>
          <button
            onClick={fetchReport}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const scoreInfo = getScoreGrade(report.scores?.overall || 0);
  const totalFacilities = report?.overview?.totalFacilities || 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">
              Facility Production Data Quality Report
            </h1>
            <p className="text-blue-700">
              Comprehensive quality assessment based on Completeness, Validity, Consistency, and Timeliness
            </p>
          </div>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Overall Data Quality Score</h2>
        <p className="text-sm text-gray-600 mb-8">
          Weighted score: Completeness (40%) + Validity (30%) + Consistency (15%) + Timeliness (15%)
        </p>
        
        <div className="flex items-center gap-12">
          {/* Score Visualization - Circular Progress */}
          <div className="relative w-56 h-56">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="112"
                cy="112"
                r="90"
                stroke="#e5e7eb"
                strokeWidth="20"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="112"
                cy="112"
                r="90"
                className={`transition-all duration-1000 ${
                  (report.scores?.overall || 0) >= 80 ? 'stroke-green-500' :
                  (report.scores?.overall || 0) >= 70 ? 'stroke-yellow-500' :
                  (report.scores?.overall || 0) >= 60 ? 'stroke-orange-500' :
                  'stroke-red-500'
                }`}
                strokeWidth="20"
                fill="none"
                strokeDasharray={`${((report.scores?.overall || 0) / 100) * 565.5} 565.5`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${scoreInfo.color}`}>
                {(report.scores?.overall || 0).toFixed(1)}
              </div>
              <div className="text-xl text-gray-600 font-medium">/ 100</div>
            </div>
          </div>

          {/* Score Details */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-6">
              <div className={`text-6xl font-bold ${scoreInfo.color}`}>
                {scoreInfo.grade}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{scoreInfo.status}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Last synced: {report.overview?.lastSync 
                    ? new Date(report.overview.lastSync).toLocaleString() 
                    : 'Never'}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Total Facilities</span>
                <span className="text-lg font-bold text-gray-900">
                  {totalFacilities.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Complete Records</span>
                <span className="text-lg font-bold text-green-600">
                  {(report.completeness?.completeRecords || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completeness */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-500" />
            <div>
              <div className="text-sm font-medium text-gray-600">Completeness</div>
              <div className="text-2xl font-bold text-blue-600">
                {report.scores?.completeness !== null ? `${Math.round(report.scores.completeness)}%` : 'N/A'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all" 
              style={{ width: `${report.scores?.completeness || 0}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            Critical fields populated
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">Weight: 40%</div>
        </div>

        {/* Validity */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-sm font-medium text-gray-600">Validity</div>
              <div className="text-2xl font-bold text-green-600">
                {report.scores?.validity !== null ? `${Math.round(report.scores.validity)}%` : 'N/A'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all" 
              style={{ width: `${report.scores?.validity || 0}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            Data integrity & format
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">Weight: 30%</div>
        </div>

        {/* Consistency */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-sm font-medium text-gray-600">Consistency</div>
              <div className="text-2xl font-bold text-purple-600">
                {report.scores?.consistency !== null ? `${Math.round(report.scores.consistency)}%` : 'N/A'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-purple-600 h-3 rounded-full transition-all" 
              style={{ width: `${report.scores?.consistency || 0}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            Standardized data format
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">Weight: 15%</div>
        </div>

        {/* Timeliness */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-orange-500" />
            <div>
              <div className="text-sm font-medium text-gray-600">Timeliness</div>
              <div className="text-2xl font-bold text-orange-600">
                {report.scores?.timeliness !== null ? `${Math.round(report.scores.timeliness)}%` : 'N/A'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-orange-600 h-3 rounded-full transition-all" 
              style={{ width: `${report.scores?.timeliness || 0}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            {report.overview?.lastSync 
              ? `Synced ${new Date(report.overview.lastSync).toLocaleDateString()}`
              : 'Never synced'}
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">Weight: 15%</div>
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
                  {totalFacilities > 0 ? ((report?.consistency?.duplicateCountyVariations || 0) / totalFacilities * 100).toFixed(1) : 0}% of facilities affected
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Validity Issues */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Data Validity Issues</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-gray-900">Expired Licenses</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {report?.validity?.expiredLicenses || 0}
            </div>
            <div className="text-sm text-red-700 mt-1">
              Immediate action required
            </div>
          </div>

          <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-gray-900">Expiring Soon</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {report?.validity?.expiringSoon || 0}
            </div>
            <div className="text-sm text-orange-700 mt-1">
              Within 30 days
            </div>
          </div>

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
            <h3 className="font-semibold text-green-900 mb-2">Production Data Recommendations</h3>
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
                <span>Use audit history to track data quality improvements over time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
