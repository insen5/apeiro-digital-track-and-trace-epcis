'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  PackageOpen, 
  History, 
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { hierarchyApi, PackDto, PackLiteDto, UnpackAllDto, RepackDto, HierarchyChange } from '@/lib/api/hierarchy';
import { HelpIcon } from '@/components/shared/HelpIcon';

type TabType = 'pack' | 'unpack' | 'repack' | 'history';

export default function HierarchyManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pack');
  const [userId] = useState('distributor-user-123'); // TODO: Get from auth context
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pack form state
  const [packForm, setPackForm] = useState<PackDto>({
    shipmentId: 0,
    caseIds: [],
    notes: '',
  });
  const [caseIdsInput, setCaseIdsInput] = useState('');

  // Pack Lite form state
  const [packLiteForm, setPackLiteForm] = useState<PackLiteDto>({
    shipmentId: 0,
    startCaseNumber: 0,
    endCaseNumber: 0,
    notes: '',
  });

  // Unpack form state
  const [unpackPackageId, setUnpackPackageId] = useState(0);
  const [unpackReason, setUnpackReason] = useState('');

  // Repack form state
  const [repackForm, setRepackForm] = useState<RepackDto>({
    packageId: 0,
    newShipmentId: 0,
    reason: '',
  });

  // History state
  const [history, setHistory] = useState<HierarchyChange[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await hierarchyApi.getHistory({ limit: 50 });
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      // Parse case IDs from comma-separated input
      const caseIds = caseIdsInput
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      if (caseIds.length === 0) {
        setMessage({ type: 'error', text: 'Please enter at least one valid case ID' });
        return;
      }

      const result = await hierarchyApi.pack(userId, {
        ...packForm,
        caseIds,
      });

      setMessage({ 
        type: 'success', 
        text: `Package created successfully with SSCC: ${result.sscc}` 
      });

      // Reset form
      setPackForm({ shipmentId: 0, caseIds: [], notes: '' });
      setCaseIdsInput('');
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create package' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePackLite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      const result = await hierarchyApi.packLite(userId, packLiteForm);

      setMessage({ 
        type: 'success', 
        text: `Package created successfully with SSCC: ${result.sscc}` 
      });

      // Reset form
      setPackLiteForm({ shipmentId: 0, startCaseNumber: 0, endCaseNumber: 0, notes: '' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create package' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnpack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      await hierarchyApi.unpackAll(userId, {
        packageId: unpackPackageId,
        reason: unpackReason,
      });

      setMessage({ 
        type: 'success', 
        text: `Package ${unpackPackageId} unpacked successfully` 
      });

      // Reset form
      setUnpackPackageId(0);
      setUnpackReason('');
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to unpack package' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRepack = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      const result = await hierarchyApi.repack(userId, repackForm);

      setMessage({ 
        type: 'success', 
        text: `Package ${repackForm.packageId} repacked successfully to shipment ${repackForm.newShipmentId}. New SSCC: ${result.sscc}` 
      });

      // Reset form
      setRepackForm({ packageId: 0, newShipmentId: 0, reason: '' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to repack package' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hierarchy Management</h1>
        <p className="mt-2 text-gray-600">
          Manage pack and unpack operations for shipment packages
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
            onClick={() => setActiveTab('pack')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'pack'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Package size={18} />
            Pack Operations
          </button>
          <button
            onClick={() => setActiveTab('unpack')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'unpack'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <PackageOpen size={18} />
            Unpack Operations
          </button>
          <button
            onClick={() => setActiveTab('repack')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'repack'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <RefreshCw size={18} />
            Repack Operations
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
            History
          </button>
        </nav>
      </div>

      {/* Pack Tab */}
      {activeTab === 'pack' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Standard Pack */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Standard Pack
              <HelpIcon topicKey="sscc" />
            </h2>
            <form onSubmit={handlePack} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipment ID
                </label>
                <input
                  type="number"
                  required
                  value={packForm.shipmentId || ''}
                  onChange={(e) => setPackForm({ ...packForm, shipmentId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Case IDs (comma-separated)
                </label>
                <textarea
                  required
                  value={caseIdsInput}
                  onChange={(e) => setCaseIdsInput(e.target.value)}
                  placeholder="e.g., 101, 102, 103"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={packForm.notes}
                  onChange={(e) => setPackForm({ ...packForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Package size={18} />}
                Create Package
              </button>
            </form>
          </div>

          {/* Pack Lite */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pack Lite (Range)
            </h2>
            <form onSubmit={handlePackLite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipment ID
                </label>
                <input
                  type="number"
                  required
                  value={packLiteForm.shipmentId || ''}
                  onChange={(e) => setPackLiteForm({ ...packLiteForm, shipmentId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Case #
                  </label>
                  <input
                    type="number"
                    required
                    value={packLiteForm.startCaseNumber || ''}
                    onChange={(e) => setPackLiteForm({ ...packLiteForm, startCaseNumber: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Case #
                  </label>
                  <input
                    type="number"
                    required
                    value={packLiteForm.endCaseNumber || ''}
                    onChange={(e) => setPackLiteForm({ ...packLiteForm, endCaseNumber: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={packLiteForm.notes}
                  onChange={(e) => setPackLiteForm({ ...packLiteForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Package size={18} />}
                Create Package (Range)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Unpack Tab */}
      {activeTab === 'unpack' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Unpack Package
            <HelpIcon topicKey="hierarchy" />
          </h2>
          <form onSubmit={handleUnpack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package ID
              </label>
              <input
                type="number"
                required
                value={unpackPackageId || ''}
                onChange={(e) => setUnpackPackageId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                required
                value={unpackReason}
                onChange={(e) => setUnpackReason(e.target.value)}
                placeholder="e.g., Inspection required, Repackaging, Customer request"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <PackageOpen size={18} />}
              Unpack Package
            </button>
          </form>
        </div>
      )}

      {/* Repack Tab */}
      {activeTab === 'repack' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Repack Package (Change Shipment)
              <HelpIcon topicKey="sscc" />
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Move a package from one shipment to another. The package will get a new SSCC and the old SSCC will be preserved in history.
          </p>
          <form onSubmit={handleRepack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package ID (to repack)
              </label>
              <input
                type="number"
                required
                value={repackForm.packageId || ''}
                onChange={(e) => setRepackForm({ ...repackForm, packageId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Shipment ID
              </label>
              <input
                type="number"
                required
                value={repackForm.newShipmentId || ''}
                onChange={(e) => setRepackForm({ ...repackForm, newShipmentId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                required
                value={repackForm.reason}
                onChange={(e) => setRepackForm({ ...repackForm, reason: e.target.value })}
                placeholder="e.g., Consolidation, Route change, Customer request"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              Repack Package
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Hierarchy Change History</h2>
            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              <RefreshCw size={16} className={historyLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={32} className="animate-spin text-blue-600" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hierarchy changes found
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
                      Operation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SSCC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((change) => (
                    <tr key={change.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(change.changeDate).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${change.operationType === 'PACK' ? 'bg-green-100 text-green-800' : ''}
                          ${change.operationType === 'UNPACK' ? 'bg-orange-100 text-orange-800' : ''}
                          ${change.operationType === 'REPACK' ? 'bg-blue-100 text-blue-800' : ''}
                          ${change.operationType === 'REASSIGN_SSCC' ? 'bg-purple-100 text-purple-800' : ''}
                        `}>
                          {change.operationType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {change.newSscc || change.parentSscc || change.oldSscc || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {change.actorUserId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {change.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
