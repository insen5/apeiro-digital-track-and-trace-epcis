'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, History, Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { productDestructionApi, InitiateDestructionDto, CompleteDestructionDto, ProductDestruction, DestructionReason, DestructionMethod, DestructionStatus } from '@/lib/api/product-destruction';
import { HelpIcon } from '@/components/shared/HelpIcon';

type TabType = 'initiate' | 'approvals' | 'complete' | 'history';

export default function DestructionPage() {
  const [activeTab, setActiveTab] = useState<TabType>('initiate');
  const [userId] = useState('shared-user-123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initiate form
  const [initiateForm, setInitiateForm] = useState<InitiateDestructionDto>({
    batchId: 0, quantity: 0, reason: 'EXPIRED', notes: ''
  });

  // Complete form
  const [completeForm, setCompleteForm] = useState<CompleteDestructionDto>({
    destructionId: 0, destructionMethod: 'INCINERATION', destructionDate: new Date(), completionNotes: ''
  });

  // Lists
  const [pendingApprovals, setPendingApprovals] = useState<ProductDestruction[]>([]);
  const [approvedDestructions, setApprovedDestructions] = useState<ProductDestruction[]>([]);
  const [history, setHistory] = useState<ProductDestruction[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'approvals') loadPendingApprovals();
    if (activeTab === 'complete') loadApproved();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const loadPendingApprovals = async () => {
    try {
      setListLoading(true);
      const data = await productDestructionApi.getPendingApprovals();
      setPendingApprovals(data);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    } finally {
      setListLoading(false);
    }
  };

  const loadApproved = async () => {
    try {
      setListLoading(true);
      const data = await productDestructionApi.getByStatus('APPROVED');
      setApprovedDestructions(data);
    } catch (error) {
      console.error('Failed to load approved destructions:', error);
    } finally {
      setListLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setListLoading(true);
      const data = await productDestructionApi.getHistory({ limit: 100 });
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setListLoading(false);
    }
  };

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      const result = await productDestructionApi.initiate(userId, initiateForm);
      const needsApproval = initiateForm.quantity >= 100;
      setMessage({ 
        type: 'success', 
        text: needsApproval 
          ? `Destruction request #${result.id} created. Manager approval required for quantities >= 100.`
          : `Destruction request #${result.id} created and auto-approved.`
      });
      setInitiateForm({ batchId: 0, quantity: 0, reason: 'EXPIRED', notes: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to initiate destruction' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (destructionId: number) => {
    try {
      await productDestructionApi.approve(userId, { destructionId, approvalNotes: 'Approved via UI' });
      setMessage({ type: 'success', text: `Destruction #${destructionId} approved successfully` });
      loadPendingApprovals();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to approve destruction' });
    }
  };

  const handleReject = async (destructionId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await productDestructionApi.reject(userId, { destructionId, rejectionReason: reason });
      setMessage({ type: 'success', text: `Destruction #${destructionId} rejected` });
      loadPendingApprovals();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to reject destruction' });
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      await productDestructionApi.complete(userId, completeForm);
      setMessage({ type: 'success', text: `Destruction #${completeForm.destructionId} completed successfully` });
      setCompleteForm({ destructionId: 0, destructionMethod: 'INCINERATION', destructionDate: new Date(), completionNotes: '' });
      loadApproved();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to complete destruction' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Destruction Management</h1>
        <p className="mt-2 text-gray-600">Manage product destruction with approval workflows</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'initiate' as TabType, label: 'Initiate Destruction', icon: AlertTriangle },
            { id: 'approvals' as TabType, label: 'Pending Approvals', icon: Clock },
            { id: 'complete' as TabType, label: 'Complete Destruction', icon: CheckCircle },
            { id: 'history' as TabType, label: 'History', icon: History },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <tab.icon size={18} />{tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'initiate' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Initiate Destruction Request <HelpIcon topicKey="destruction" />
          </h2>
          <form onSubmit={handleInitiate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                <input type="number" required value={initiateForm.batchId || ''} onChange={(e) => setInitiateForm({ ...initiateForm, batchId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" required value={initiateForm.quantity || ''} onChange={(e) => setInitiateForm({ ...initiateForm, quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {initiateForm.quantity >= 100 && (
                  <p className="mt-1 text-xs text-orange-600">⚠️ Quantities {'>'}= 100 require manager approval</p>
                )}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select required value={initiateForm.reason} onChange={(e) => setInitiateForm({ ...initiateForm, reason: e.target.value as DestructionReason })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="EXPIRED">Expired</option><option value="DAMAGED">Damaged</option><option value="COUNTERFEIT">Counterfeit</option>
                <option value="RECALL">Recall</option><option value="QUALITY_FAILURE">Quality Failure</option><option value="REGULATORY">Regulatory</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Location ID (optional)</label>
              <input type="number" value={initiateForm.locationId || ''} onChange={(e) => setInitiateForm({ ...initiateForm, locationId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={initiateForm.notes} onChange={(e) => setInitiateForm({ ...initiateForm, notes: e.target.value })} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <AlertTriangle size={18} />} Initiate Destruction
            </button>
          </form>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
            <button onClick={loadPendingApprovals} disabled={listLoading} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
              <RefreshCw size={16} className={listLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {listLoading ? <div className="flex items-center justify-center py-12"><RefreshCw size={32} className="animate-spin text-blue-600" /></div> :
            pendingApprovals.length === 0 ? <div className="text-center py-12 text-gray-500">No pending approvals</div> :
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initiated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingApprovals.map(dest => (
                    <tr key={dest.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{dest.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{dest.batchId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{dest.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{dest.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(dest.initiatedAt).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button onClick={() => handleApprove(dest.id)} className="text-green-600 hover:text-green-800">
                          <CheckCircle size={18} className="inline" /> Approve
                        </button>
                        <button onClick={() => handleReject(dest.id)} className="text-red-600 hover:text-red-800">
                          <XCircle size={18} className="inline" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}

      {activeTab === 'complete' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Destruction</h2>
            <form onSubmit={handleComplete} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Destruction ID</label>
                <select required value={completeForm.destructionId || ''} onChange={(e) => setCompleteForm({ ...completeForm, destructionId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select approved destruction...</option>
                  {approvedDestructions.map(d => (
                    <option key={d.id} value={d.id}>ID {d.id} - Batch {d.batchId} ({d.quantity} units)</option>
                  ))}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Destruction Method</label>
                <select required value={completeForm.destructionMethod} onChange={(e) => setCompleteForm({ ...completeForm, destructionMethod: e.target.value as DestructionMethod })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="INCINERATION">Incineration</option><option value="CHEMICAL">Chemical</option><option value="LANDFILL">Landfill</option>
                  <option value="RECYCLING">Recycling</option><option value="OTHER">Other</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Destruction Date</label>
                <input type="datetime-local" required value={new Date(completeForm.destructionDate).toISOString().slice(0, 16)}
                  onChange={(e) => setCompleteForm({ ...completeForm, destructionDate: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Witness Name (optional)</label>
                  <input type="text" value={completeForm.witnessName || ''} onChange={(e) => setCompleteForm({ ...completeForm, witnessName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Witness ID (optional)</label>
                  <input type="text" value={completeForm.witnessId || ''} onChange={(e) => setCompleteForm({ ...completeForm, witnessId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Certificate URL (optional)</label>
                <div className="flex gap-2">
                  <input type="text" value={completeForm.certificateUrl || ''} onChange={(e) => setCompleteForm({ ...completeForm, certificateUrl: e.target.value })}
                    placeholder="https://..." className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-1">
                    <Upload size={16} /> Upload
                  </button>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Completion Notes</label>
                <textarea value={completeForm.completionNotes} onChange={(e) => setCompleteForm({ ...completeForm, completionNotes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />} Complete Destruction
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Destruction History</h2>
            <button onClick={loadHistory} disabled={listLoading} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
              <RefreshCw size={16} className={listLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {listLoading ? <div className="flex items-center justify-center py-12"><RefreshCw size={32} className="animate-spin text-blue-600" /></div> :
            history.length === 0 ? <div className="text-center py-12 text-gray-500">No destruction records</div> :
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map(dest => (
                    <tr key={dest.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{dest.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${dest.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : dest.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {dest.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{dest.batchId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{dest.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{dest.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{dest.destructionMethod || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{dest.completedAt ? new Date(dest.completedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}
    </div>
  );
}
