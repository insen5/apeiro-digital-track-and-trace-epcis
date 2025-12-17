'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  History, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  productStatusApi, 
  CreateProductStatusDto, 
  ProductStatusType, 
  StatusReport,
  ProductStatus 
} from '@/lib/api/product-status';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { HelpIcon } from '@/components/shared/HelpIcon';

type TabType = 'update' | 'history' | 'reports';

export default function ProductStatusPage() {
  const [activeTab, setActiveTab] = useState<TabType>('update');
  const [userId] = useState('manufacturer-user-123'); // TODO: Get from auth context
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update form state
  const [statusForm, setStatusForm] = useState<CreateProductStatusDto>({
    status: 'ACTIVE',
    notes: '',
  });
  const [identifierType, setIdentifierType] = useState<'product' | 'batch' | 'sgtin'>('product');

  // History state
  const [history, setHistory] = useState<ProductStatus[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<ProductStatusType | ''>('');

  // Reports state
  const [report, setReport] = useState<StatusReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    } else if (activeTab === 'reports') {
      loadReport();
    }
  }, [activeTab, historyFilter]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await productStatusApi.getHistory({
        status: historyFilter || undefined,
        limit: 100,
      });
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadReport = async () => {
    try {
      setReportLoading(true);
      const data = await productStatusApi.getReport();
      setReport(data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      await productStatusApi.updateStatus(userId, statusForm);

      setMessage({ 
        type: 'success', 
        text: 'Product status updated successfully' 
      });

      // Reset form
      setStatusForm({
        status: 'ACTIVE',
        notes: '',
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update status. Sensitive statuses require authorization.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Status Management</h1>
        <p className="mt-2 text-gray-600">
          Track and manage product statuses throughout the supply chain
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`
          mb-6 p-4 rounded-md flex items-start gap-3
          ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}
        `}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('update')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'update'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <AlertTriangle size={18} />
            Update Status
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <History size={18} />
            Status History
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <TrendingUp size={18} />
            Status Reports
          </button>
        </nav>
      </div>

      {/* Update Status Tab */}
      {activeTab === 'update' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Update Product Status
            <HelpIcon topicKey="sgtin" />
          </h2>
          
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            {/* Identifier Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identifier Type
              </label>
              <div className="flex gap-4">
                {(['product', 'batch', 'sgtin'] as const).map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      checked={identifierType === type}
                      onChange={() => {
                        setIdentifierType(type);
                        setStatusForm({
                          ...statusForm,
                          productId: undefined,
                          batchId: undefined,
                          sgtin: undefined,
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Identifier Input */}
            {identifierType === 'product' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product ID
                </label>
                <input
                  type="number"
                  required
                  value={statusForm.productId || ''}
                  onChange={(e) => setStatusForm({ ...statusForm, productId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {identifierType === 'batch' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch ID
                </label>
                <input
                  type="number"
                  required
                  value={statusForm.batchId || ''}
                  onChange={(e) => setStatusForm({ ...statusForm, batchId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {identifierType === 'sgtin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  SGTIN
                  <HelpIcon topicKey="sgtin" size={14} />
                </label>
                <input
                  type="text"
                  required
                  value={statusForm.sgtin || ''}
                  onChange={(e) => setStatusForm({ ...statusForm, sgtin: e.target.value })}
                  placeholder="e.g., urn:epc:id:sgtin:..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Status Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                required
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value as ProductStatusType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="LOST">Lost</option>
                <option value="STOLEN">Stolen</option>
                <option value="DAMAGED">Damaged</option>
                <option value="SAMPLE">Sample</option>
                <option value="EXPORT">Export</option>
                <option value="DISPENSING">Dispensing</option>
              </select>
              {(['LOST', 'STOLEN'].includes(statusForm.status)) && (
                <p className="mt-1 text-xs text-orange-600">
                  ⚠️ This status requires manager authorization
                </p>
              )}
            </div>

            {/* Quantity (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (optional)
              </label>
              <input
                type="number"
                value={statusForm.quantity || ''}
                onChange={(e) => setStatusForm({ ...statusForm, quantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={statusForm.notes}
                onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
              Update Status
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Status Change History</h2>
            <div className="flex items-center gap-4">
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value as ProductStatusType | '')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="LOST">Lost</option>
                <option value="STOLEN">Stolen</option>
                <option value="DAMAGED">Damaged</option>
                <option value="SAMPLE">Sample</option>
                <option value="EXPORT">Export</option>
                <option value="DISPENSING">Dispensing</option>
              </select>
              <button
                onClick={loadHistory}
                disabled={historyLoading}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <RefreshCw size={16} className={historyLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={32} className="animate-spin text-blue-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No status changes found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product/Batch/SGTIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.reportedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.productId && `Product: ${item.productId}`}
                        {item.batchId && `Batch: ${item.batchId}`}
                        {item.sgtin && <span className="font-mono text-xs">{item.sgtin}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {reportLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={32} className="animate-spin text-blue-600" />
            </div>
          ) : report ? (
            <>
              {/* Critical Issues Card */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-red-900 mb-4">Critical Issues</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-red-700">Lost Items</p>
                    <p className="text-2xl font-bold text-red-900">{report.criticalIssues.lostCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-red-700">Stolen Items</p>
                    <p className="text-2xl font-bold text-red-900">{report.criticalIssues.stolenCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-red-700">Damaged Items</p>
                    <p className="text-2xl font-bold text-red-900">{report.criticalIssues.damagedCount}</p>
                  </div>
                </div>
              </div>

              {/* Status Summary */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.summary.map((item) => (
                    <div key={item.status} className="border border-gray-200 rounded-lg p-4">
                      <StatusBadge status={item.status} size="md" className="mb-2" />
                      <p className="text-2xl font-bold text-gray-900">{item.count.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Quantity: {item.totalQuantity.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Changes */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Status Changes</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.recentChanges.slice(0, 10).map((change) => (
                        <tr key={change.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(change.reportedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={change.status} size="sm" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                            {change.productId || change.batchId || change.sgtin}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {change.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No report data available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
