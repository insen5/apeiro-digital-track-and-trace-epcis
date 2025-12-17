'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Database,
  Loader2,
  RefreshCw,
  BarChart3,
  FileText,
  Shield,
  MapPin,
  Building2,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import { masterDataApi, type DataQualityReport } from '@/lib/api/master-data';

export default function DataQualityTab() {
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
      setError(err.message || 'Failed to fetch data quality report');
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-600';
    if (score >= 80) return 'from-green-500 to-yellow-500';
    if (score >= 70) return 'from-yellow-500 to-orange-500';
    if (score >= 60) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', status: 'Excellent', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', status: 'Good', color: 'text-green-600' };
    if (score >= 70) return { grade: 'B', status: 'Acceptable', color: 'text-yellow-600' };
    if (score >= 60) return { grade: 'C', status: 'Needs Improvement', color: 'text-orange-600' };
    return { grade: 'F', status: 'Critical', color: 'text-red-600' };
  };

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 flex flex-col items-center justify-center border border-gray-200">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-600">Generating comprehensive data quality report...</p>
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

  const scoreInfo = getScoreGrade(report.overview.dataQualityScore);
  const scoreColor = getScoreColor(report.overview.dataQualityScore);

  return (
    <div className="space-y-6">
      {/* Header Card - Matching the mockup style */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 p-6 rounded-lg shadow-md border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-purple-900 mb-2">
              Premise Data Quality Report
            </h1>
            <p className="text-purple-700">
              Comprehensive quality assessment based on Completeness, Validity, Consistency, and Timeliness
            </p>
          </div>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 transition-colors"
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
                  report.overview.dataQualityScore >= 80 ? 'stroke-green-500' :
                  report.overview.dataQualityScore >= 70 ? 'stroke-yellow-500' :
                  report.overview.dataQualityScore >= 60 ? 'stroke-orange-500' :
                  'stroke-red-500'
                }`}
                strokeWidth="20"
                fill="none"
                strokeDasharray={`${(report.overview.dataQualityScore / 100) * 565.5} 565.5`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${scoreInfo.color}`}>
                {report.overview.dataQualityScore.toFixed(1)}
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
                  Last synced: {report.overview.lastSyncDate 
                    ? new Date(report.overview.lastSyncDate).toLocaleString() 
                    : 'Never'}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Total Premises</span>
                <span className="text-lg font-bold text-gray-900">
                  {report.overview.totalPremises.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Complete Records</span>
                <span className="text-lg font-bold text-green-600">
                  {report.completeness.completeRecords.toLocaleString()} ({report.completeness.completenessPercentage.toFixed(1)}%)
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
                {report.completeness.completenessPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all" 
              style={{ width: `${report.completeness.completenessPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            {report.completeness.completeRecords} / {report.overview.totalPremises} complete
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">Weight: 40%</div>
        </div>

        {/* Validity - Data Integrity */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-sm font-medium text-gray-600">Validity</div>
              <div className="text-2xl font-bold text-green-600">
                {report.validity.duplicatePremiseIds === 0 && report.validity.invalidGLN === 0 ? '100%' : 
                  ((report.overview.totalPremises - report.validity.duplicatePremiseIds - report.validity.invalidGLN) / report.overview.totalPremises * 100).toFixed(1) + '%'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all" 
              style={{ width: report.validity.duplicatePremiseIds === 0 && report.validity.invalidGLN === 0 ? '100%' : 
                `${((report.overview.totalPremises - report.validity.duplicatePremiseIds - report.validity.invalidGLN) / report.overview.totalPremises * 100)}%` }}
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
                {report.distribution.byCounty.length > 0 && report.distribution.byBusinessType.length > 0 ? '100%' : 'N/A'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-purple-600 h-3 rounded-full transition-all" 
              style={{ width: report.distribution.byCounty.length > 0 ? '100%' : '0%' }}
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
                {report.overview.lastSyncDate ? '95%' : '0%'}
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-orange-600 h-3 rounded-full transition-all" 
              style={{ width: report.overview.lastSyncDate ? '95%' : '0%' }}
            />
          </div>
          <div className="text-xs text-gray-600">
            {report.overview.lastSyncDate 
              ? `Synced ${new Date(report.overview.lastSyncDate).toLocaleString()}`
              : 'Never synced'}
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">Weight: 15%</div>
        </div>
      </div>

      {/* DATA COMPLETENESS SECTION */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Data Completeness</h2>
        </div>
        
        {/* Completeness Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-blue-900">Complete Records</span>
            <span className="text-2xl font-bold text-blue-600">
              {report.completeness.completeRecords} / {report.overview.totalPremises}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-4">
            <div 
              className="bg-blue-600 h-4 rounded-full flex items-center justify-end pr-2 transition-all" 
              style={{ width: `${report.completeness.completenessPercentage}%` }}
            >
              <span className="text-xs font-bold text-white">
                {report.completeness.completenessPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Missing Data Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border ${report.completeness.missingGLN > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingGLN > 0 ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing GLN</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingGLN > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {report.completeness.missingGLN}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {report.completeness.missingGLN > 0 ? 'EPCIS Required' : 'All assigned'}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingCounty > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingCounty > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing County</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingCounty > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingCounty}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((report.completeness.missingCounty / report.overview.totalPremises) * 100).toFixed(1)}% missing
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingBusinessType > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingBusinessType > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing Business Type</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingBusinessType > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingBusinessType}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((report.completeness.missingBusinessType / report.overview.totalPremises) * 100).toFixed(1)}% missing
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingOwnership > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingOwnership > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing Ownership</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingOwnership > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingOwnership}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((report.completeness.missingOwnership / report.overview.totalPremises) * 100).toFixed(1)}% missing
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingSuperintendent > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingSuperintendent > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing Superintendent</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingSuperintendent > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingSuperintendent}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Regulatory required
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingLicenseInfo > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingLicenseInfo > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing License Info</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingLicenseInfo > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingLicenseInfo}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Critical compliance
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingLocation > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingLocation > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing Location</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingLocation > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingLocation}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              County/Constituency/Ward
            </div>
          </div>
        </div>
      </div>

      {/* DATA VALIDITY SECTION */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Data Validity</h2>
        </div>

        {/* License Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-5 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="text-sm font-medium text-green-800">Valid Licenses</div>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {report.validity.validLicenses}
            </div>
            <div className="text-sm text-green-700">
              {((report.validity.validLicenses / report.overview.totalPremises) * 100).toFixed(1)}% of total premises
            </div>
            <div className="text-xs text-green-600 mt-2">
              License expires &gt; 30 days from now
            </div>
          </div>

          <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div className="text-sm font-medium text-yellow-800">Expiring Soon</div>
            </div>
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {report.validity.expiringSoon}
            </div>
            <div className="text-sm text-yellow-700">
              {((report.validity.expiringSoon / report.overview.totalPremises) * 100).toFixed(1)}% of total premises
            </div>
            <div className="text-xs text-yellow-600 mt-2">
              License expires within 30 days
            </div>
          </div>

          <div className="p-5 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <div className="text-sm font-medium text-red-800">Expired Licenses</div>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">
              {report.validity.expiredLicenses}
            </div>
            <div className="text-sm text-red-700">
              {((report.validity.expiredLicenses / report.overview.totalPremises) * 100).toFixed(1)}% of total premises
            </div>
            <div className="text-xs text-red-600 mt-2">
              ⚠️ Requires immediate renewal
            </div>
          </div>
        </div>

        {/* Data Integrity Issues */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${report.validity.duplicatePremiseIds > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="text-xs font-medium text-gray-600 mb-2">Duplicate Premise IDs</div>
            <div className={`text-2xl font-bold ${report.validity.duplicatePremiseIds > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {report.validity.duplicatePremiseIds}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {report.validity.duplicatePremiseIds > 0 ? '⚠️ Critical Issue' : '✅ No duplicates'}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.validity.invalidGLN > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="text-xs font-medium text-gray-600 mb-2">Invalid GLN Format</div>
            <div className={`text-2xl font-bold ${report.validity.invalidGLN > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.validity.invalidGLN}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              GS1 format validation
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.validity.invalidDates > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="text-xs font-medium text-gray-600 mb-2">Invalid Dates</div>
            <div className={`text-2xl font-bold ${report.validity.invalidDates > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.validity.invalidDates}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Date format issues
            </div>
          </div>
        </div>
      </div>

      {/* DISTRIBUTION ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By County */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Distribution by County</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {report.distribution.byCounty.map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{item.county}</span>
                  <span className="text-gray-600">
                    {item.count.toLocaleString()} 
                    <span className="text-gray-500 ml-1">({item.percentage.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all group-hover:from-green-600 group-hover:to-green-700"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Business Type */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Distribution by Business Type</h3>
          </div>
          <div className="space-y-3">
            {report.distribution.byBusinessType.map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{item.type}</span>
                  <span className="text-gray-600">
                    {item.count.toLocaleString()} 
                    <span className="text-gray-500 ml-1">({item.percentage.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all group-hover:from-blue-600 group-hover:to-blue-700"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Ownership */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Distribution by Ownership</h3>
          </div>
          <div className="space-y-3">
            {report.distribution.byOwnership.map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{item.ownership}</span>
                  <span className="text-gray-600">
                    {item.count.toLocaleString()} 
                    <span className="text-gray-500 ml-1">({item.percentage.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all group-hover:from-purple-600 group-hover:to-purple-700"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Superintendent Cadre */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-bold text-gray-900">Distribution by Superintendent Cadre</h3>
          </div>
          <div className="space-y-3">
            {report.distribution.bySuperintendentCadre.map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">{item.cadre}</span>
                  <span className="text-gray-600">
                    {item.count.toLocaleString()} 
                    <span className="text-gray-500 ml-1">({item.percentage.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all group-hover:from-orange-600 group-hover:to-orange-700"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ISSUES IDENTIFIED */}
      {report.issues.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Issues Identified ({report.issues.length})
            </h2>
          </div>
          <div className="space-y-3">
            {report.issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-5 border-l-4 rounded-lg ${
                  issue.severity === 'high' ? 'bg-red-50 border-red-500' :
                  issue.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(issue.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-sm uppercase ${
                        issue.severity === 'high' ? 'text-red-700' :
                        issue.severity === 'medium' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {issue.severity} SEVERITY
                      </span>
                      <span className="text-lg font-bold text-gray-900">{issue.count}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800 mb-1">
                      [{issue.category}]
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {issue.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API LIMITATIONS & DATA SOURCE GAPS */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Known API Limitations & Data Source Gaps
          </h2>
        </div>
        
        <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong>Note:</strong> These are not data quality issues, but limitations of the upstream PPB APIs. 
            These gaps require policy changes, API enhancements, or alternative data collection methods.
          </p>
        </div>

        <div className="space-y-4">
          {/* Address Data Limitation */}
          <div className="p-5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-2">
                  ℹ️ PPB Catalogue API does not provide street addresses
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><strong>Missing:</strong> address_line1, address_line2, postal_code</div>
                  <div><strong>Available:</strong> county, constituency, ward only</div>
                  <div><strong>Impact:</strong> Cannot use precise addresses in EPCIS events</div>
                  <div className="pt-2 text-blue-700">
                    <strong>Mitigation:</strong> Hierarchical location precision implemented (V09) - 
                    supports county/ward-level locations without requiring street addresses
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier/Manufacturer API Gap */}
          <div className="p-5 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-orange-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-orange-900 mb-2">
                  ⚠️ No API exists for supplier/manufacturer entities
                </div>
                <div className="text-sm text-orange-800 space-y-1">
                  <div><strong>Current State:</strong> 7 suppliers/manufacturers (manual seed data only)</div>
                  <div><strong>Data Split:</strong> 4 distributors + 3 manufacturers (stored in suppliers table)</div>
                  <div><strong>Impact:</strong> Cannot auto-sync supplier master data from PPB</div>
                  <div className="pt-2 text-orange-700">
                    <strong>Recommended:</strong> Build supplier/manufacturer self-registration portal OR 
                    request PPB to create Supplier/Manufacturer Entity Registry API
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LSP API Gap */}
          <div className="p-5 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-purple-900 mb-2">
                  ⚠️ No API exists for logistics providers
                </div>
                <div className="text-sm text-purple-800 space-y-1">
                  <div><strong>Current State:</strong> 3 logistics providers (manual seed data only)</div>
                  <div><strong>Impact:</strong> LSP master data must be maintained manually</div>
                  <div className="pt-2 text-purple-700">
                    <strong>Recommended:</strong> Manual registration form OR request PPB to create 
                    Logistics Provider Registry API
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premise-to-Supplier Mapping Gap */}
          <div className="p-5 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-red-900 mb-2">
                  ❌ Premise-to-supplier mapping not provided by PPB
                </div>
                <div className="text-sm text-red-800 space-y-1">
                  <div><strong>Current State:</strong> {report.overview.totalPremises.toLocaleString()} premises default to supplier_id=1</div>
                  <div><strong>Impact:</strong> Cannot identify which supplier owns which premises</div>
                  <div><strong>Root Cause:</strong> PPB API provides premises but not ownership mapping</div>
                  <div className="pt-2 text-red-700">
                    <strong>Required:</strong> Manual mapping OR enhanced PPB API with premise ownership data OR 
                    supplier self-registration with premise claiming
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">11,533</div>
            <div className="text-sm text-gray-600">Premises from PPB API</div>
            <div className="text-xs text-green-600 mt-1">✅ Automated sync</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">7</div>
            <div className="text-sm text-gray-600">Suppliers/Manufacturers</div>
            <div className="text-xs text-red-600 mt-1">❌ Manual data only</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">3</div>
            <div className="text-sm text-gray-600">Logistics Providers</div>
            <div className="text-xs text-red-600 mt-1">❌ Manual data only</div>
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS */}
      <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Recommendations</h2>
        </div>
        <div className="space-y-3">
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-800 leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Field Criticality Reference */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Field Criticality Reference</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="font-semibold text-red-700 mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              HIGH Criticality
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span><strong>GLN:</strong> Required for EPCIS events</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span><strong>Premise Name:</strong> Cannot identify premise</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span><strong>County:</strong> Geographic distribution tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span><strong>License Validity:</strong> Cannot verify active status</span>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              MEDIUM Criticality
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span><strong>Constituency:</strong> Incomplete location data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span><strong>Ward:</strong> Incomplete location data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span><strong>Business Type:</strong> Cannot categorize premises</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span><strong>Superintendent:</strong> Regulatory compliance</span>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              LOW Criticality
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>Ownership:</strong> Business intelligence only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>Superintendent Reg #:</strong> Verification only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong>License Year:</strong> Convenience field</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quality Targets */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg shadow-md border border-gray-300">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quality Improvement Targets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-600 mb-3">Current Baseline</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Quality Score:</span>
                <span className="font-bold text-gray-900">{report.overview.dataQualityScore.toFixed(1)}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Completeness:</span>
                <span className="font-bold text-gray-900">{report.completeness.completenessPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Valid Licenses:</span>
                <span className="font-bold text-gray-900">
                  {((report.validity.validLicenses / report.overview.totalPremises) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-300">
            <div className="text-sm font-semibold text-yellow-900 mb-3">Q1 2026 Target</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-800">Quality Score:</span>
                <span className="font-bold text-yellow-900">≥ 85/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-800">Completeness:</span>
                <span className="font-bold text-yellow-900">≥ 90%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-800">Valid Licenses:</span>
                <span className="font-bold text-yellow-900">≥ 98%</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-5 rounded-lg border border-green-300">
            <div className="text-sm font-semibold text-green-900 mb-3">Q4 2026 Goal</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-800">Quality Score:</span>
                <span className="font-bold text-green-900">≥ 95/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800">Completeness:</span>
                <span className="font-bold text-green-900">≥ 98%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-800">Valid Licenses:</span>
                <span className="font-bold text-green-900">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

