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
import { masterDataApi, type PractitionerQualityReport } from '@/lib/api/master-data';

export default function DataQualityTab() {
  const [report, setReport] = useState<PractitionerQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await masterDataApi.practitioners.getDataQualityReport();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data quality report');
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAudit = async () => {
    try {
      setSaving(true);
      await masterDataApi.practitioners.saveQualityAudit('manual', 'User-triggered audit snapshot');
      alert('Quality audit snapshot saved successfully!');
    } catch (err: any) {
      alert(`Failed to save audit: ${err.message}`);
    } finally {
      setSaving(false);
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
              Practitioner Data Quality Report
            </h1>
            <p className="text-purple-700">
              Comprehensive quality assessment for healthcare practitioner registrations
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchReport}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
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
                  report.scores.overall >= 80 ? 'stroke-green-500' :
                  report.scores.overall >= 70 ? 'stroke-yellow-500' :
                  report.scores.overall >= 60 ? 'stroke-orange-500' :
                  'stroke-red-500'
                }`}
                strokeWidth="20"
                fill="none"
                strokeDasharray={`${(report.scores.overall / 100) * 565.5} 565.5`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${scoreInfo.color}`}>
                {report.scores.overall.toFixed(1)}
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
                <span className="text-sm font-medium text-gray-700">Total Practitioners</span>
                <span className="text-lg font-bold text-gray-900">
                  {report.overview.totalPractitioners.toLocaleString()}
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
            {report.completeness.completeRecords} / {report.overview.totalPractitioners} complete
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
                {report.scores.validity.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all" 
              style={{ width: `${report.scores.validity}%` }}
            />
          </div>
          <div className="text-xs text-gray-600">
            License validity & data integrity
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">Weight: 30%</div>
        </div>

        {/* Consistency */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-sm font-medium text-gray-600">Consistency</div>
              <div className="text-2xl font-bold text-purple-600">
                {report.scores?.consistency ? report.scores.consistency.toFixed(1) : '0.0'}%
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
            Data standardization & uniformity
          </div>
          <div className="text-xs font-medium text-gray-500 mt-1">Weight: 15%</div>
        </div>

        {/* Timeliness */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            <div>
              <div className="text-sm font-medium text-gray-600">Timeliness</div>
              <div className="text-2xl font-bold text-orange-600">
                {report.scores?.timeliness ? report.scores.timeliness.toFixed(1) : '0.0'}%
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
            Data currency & update frequency
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
              {report.completeness.completeRecords} / {report.overview.totalPractitioners}
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
          <div className={`p-4 rounded-lg border ${report.completeness.missingEmail > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingEmail > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing Email</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingEmail > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingEmail}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {((report.completeness.missingEmail / report.overview.totalPractitioners) * 100).toFixed(1)}% missing
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingPhone > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingPhone > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing Phone</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingPhone > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingPhone}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Communication required
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
              Geographic distribution
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingCadre > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingCadre > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing Cadre</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingCadre > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingCadre}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Professional qualification
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingLicenseInfo > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingLicenseInfo > 0 ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing License Info</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingLicenseInfo > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {report.completeness.missingLicenseInfo}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Critical compliance
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingFacility > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingFacility > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing Facility</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingFacility > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingFacility}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Practice location
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.completeness.missingAddress > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {report.completeness.missingAddress > 0 ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <div className="text-xs font-medium text-gray-600">Missing Address</div>
            </div>
            <div className={`text-2xl font-bold ${report.completeness.missingAddress > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.completeness.missingAddress}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Physical location
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

        {/* Data Integrity Issues - Real validity metrics only */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${report.validity.duplicateRegistrationNumbers > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="text-xs font-medium text-gray-600 mb-2">Duplicate Registration Numbers</div>
            <div className={`text-2xl font-bold ${report.validity.duplicateRegistrationNumbers > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {report.validity.duplicateRegistrationNumbers}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {report.validity.duplicateRegistrationNumbers > 0 ? '⚠️ Critical Issue' : '✅ No duplicates'}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${report.validity.invalidEmail > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="text-xs font-medium text-gray-600 mb-2">Invalid Email Format</div>
            <div className={`text-2xl font-bold ${report.validity.invalidEmail > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {report.validity.invalidEmail}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Email format validation
            </div>
          </div>
        </div>
      </div>

      {/* DISTRIBUTION ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Cadre */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Distribution by Cadre</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {report.distribution.byCadre.map((item, idx) => (
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
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all group-hover:from-blue-600 group-hover:to-blue-700"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By County */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="w-6 h-6 text-purple-600" />
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
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all group-hover:from-purple-600 group-hover:to-purple-700"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By License Status */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-bold text-gray-900">Distribution by License Status</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {report.distribution.byLicenseStatus.map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">{item.status}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{item.count.toLocaleString()}</div>
                <div className="text-xs text-gray-600">{item.percentage.toFixed(1)}% of total</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* RECOMMENDATIONS */}
      <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Quality Improvement Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.completeness.missingEmail > 50 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-800">Prioritize email collection for {report.completeness.missingEmail} practitioners</span>
            </div>
          )}
          {report.validity.expiredLicenses > 0 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-800">Follow up on {report.validity.expiredLicenses} expired licenses</span>
            </div>
          )}
          {report.validity.expiringSoon > 0 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-800">Send renewal reminders to {report.validity.expiringSoon} practitioners</span>
            </div>
          )}
          {report.completeness.missingFacility > 100 && (
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-800">Collect facility information for better tracking</span>
            </div>
          )}
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-800">Schedule monthly data quality audits</span>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-800">Implement automated license expiry alerts</span>
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
                <span className="font-bold text-gray-900">{report.scores.overall.toFixed(1)}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Completeness:</span>
                <span className="font-bold text-gray-900">{report.completeness.completenessPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Valid Licenses:</span>
                <span className="font-bold text-gray-900">
                  {((report.validity.validLicenses / report.overview.totalPractitioners) * 100).toFixed(1)}%
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

