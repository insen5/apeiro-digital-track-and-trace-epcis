'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftCircle, ArrowRightCircle, Clock, History, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { productReturnsApi, ReturnReceivingDto, ReturnShippingDto, ProductReturn, ReturnReason, ReturnStatus } from '@/lib/api/product-returns';
import { HelpIcon } from '@/components/shared/HelpIcon';

type TabType = 'receiving' | 'shipping' | 'pending' | 'history';

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('receiving');
  const [userId] = useState('distributor-user-123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Receiving form
  const [receivingForm, setReceivingForm] = useState<ReturnReceivingDto>({
    batchId: 0, quantity: 0, reason: 'EXPIRED', returnedFromFacilityId: 0, returnedToFacilityId: 0, notes: ''
  });

  // Shipping form
  const [shippingForm, setShippingForm] = useState<ReturnShippingDto>({
    batchId: 0, quantity: 0, reason: 'EXPIRED', shippingFromFacilityId: 0, shippingToFacilityId: 0, notes: ''
  });

  // Lists
  const [pendingReturns, setPendingReturns] = useState<ProductReturn[]>([]);
  const [history, setHistory] = useState<ProductReturn[]>([]);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'pending') loadPending();
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  const loadPending = async () => {
    try {
      setListLoading(true);
      const data = await productReturnsApi.getPendingReturns();
      setPendingReturns(data);
    } catch (error) {
      console.error('Failed to load pending returns:', error);
    } finally {
      setListLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setListLoading(true);
      const data = await productReturnsApi.getHistory({ limit: 100 });
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setListLoading(false);
    }
  };

  const handleReceiving = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      await productReturnsApi.createReturnReceipt(userId, receivingForm);
      setMessage({ type: 'success', text: 'Return receipt created successfully' });
      setReceivingForm({ batchId: 0, quantity: 0, reason: 'EXPIRED', returnedFromFacilityId: 0, returnedToFacilityId: 0, notes: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create return receipt' });
    } finally {
      setLoading(false);
    }
  };

  const handleShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      await productReturnsApi.createReturnShipment(userId, shippingForm);
      setMessage({ type: 'success', text: 'Return shipment created successfully' });
      setShippingForm({ batchId: 0, quantity: 0, reason: 'EXPIRED', shippingFromFacilityId: 0, shippingToFacilityId: 0, notes: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create return shipment' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Return Logistics</h1>
        <p className="mt-2 text-gray-600">Manage product returns throughout the supply chain</p>
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
            { id: 'receiving' as TabType, label: 'Return Receiving', icon: ArrowLeftCircle },
            { id: 'shipping' as TabType, label: 'Return Shipping', icon: ArrowRightCircle },
            { id: 'pending' as TabType, label: 'Pending Returns', icon: Clock },
            { id: 'history' as TabType, label: 'History', icon: History },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <tab.icon size={18} />{tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'receiving' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            Return Receiving <HelpIcon topicKey="returns" />
          </h2>
          <form onSubmit={handleReceiving} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                <input type="number" required value={receivingForm.batchId || ''} onChange={(e) => setReceivingForm({ ...receivingForm, batchId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" required value={receivingForm.quantity || ''} onChange={(e) => setReceivingForm({ ...receivingForm, quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select required value={receivingForm.reason} onChange={(e) => setReceivingForm({ ...receivingForm, reason: e.target.value as ReturnReason })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="EXPIRED">Expired</option><option value="DAMAGED">Damaged</option><option value="RECALL">Recall</option>
                <option value="OVERSTOCKING">Overstocking</option><option value="QUALITY_ISSUE">Quality Issue</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">From Facility ID</label>
                <input type="number" required value={receivingForm.returnedFromFacilityId || ''} onChange={(e) => setReceivingForm({ ...receivingForm, returnedFromFacilityId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">To Facility ID</label>
                <input type="number" required value={receivingForm.returnedToFacilityId || ''} onChange={(e) => setReceivingForm({ ...receivingForm, returnedToFacilityId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">SSCC (optional) <HelpIcon topicKey="sscc" size={14} /></label>
              <input type="text" value={receivingForm.sscc} onChange={(e) => setReceivingForm({ ...receivingForm, sscc: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={receivingForm.notes} onChange={(e) => setReceivingForm({ ...receivingForm, notes: e.target.value })} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <ArrowLeftCircle size={18} />} Create Return Receipt
            </button>
          </form>
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Shipping</h2>
          <form onSubmit={handleShipping} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                <input type="number" required value={shippingForm.batchId || ''} onChange={(e) => setShippingForm({ ...shippingForm, batchId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" required value={shippingForm.quantity || ''} onChange={(e) => setShippingForm({ ...shippingForm, quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select required value={shippingForm.reason} onChange={(e) => setShippingForm({ ...shippingForm, reason: e.target.value as ReturnReason })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="EXPIRED">Expired</option><option value="DAMAGED">Damaged</option><option value="RECALL">Recall</option>
                <option value="OVERSTOCKING">Overstocking</option><option value="QUALITY_ISSUE">Quality Issue</option><option value="OTHER">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">From Facility ID</label>
                <input type="number" required value={shippingForm.shippingFromFacilityId || ''} onChange={(e) => setShippingForm({ ...shippingForm, shippingFromFacilityId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">To Facility ID</label>
                <input type="number" required value={shippingForm.shippingToFacilityId || ''} onChange={(e) => setShippingForm({ ...shippingForm, shippingToFacilityId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reference Document Number (optional)</label>
              <input type="text" value={shippingForm.referenceDocumentNumber} onChange={(e) => setShippingForm({ ...shippingForm, referenceDocumentNumber: e.target.value })}
                placeholder="e.g., RMA-12345" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <ArrowRightCircle size={18} />} Create Return Shipment
            </button>
          </form>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pending Returns</h2>
            <button onClick={loadPending} disabled={listLoading} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
              <RefreshCw size={16} className={listLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {listLoading ? <div className="flex items-center justify-center py-12"><RefreshCw size={32} className="animate-spin text-blue-600" /></div> :
            pendingReturns.length === 0 ? <div className="text-center py-12 text-gray-500">No pending returns</div> :
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingReturns.map(ret => (
                    <tr key={ret.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(ret.returnDate).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.returnType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.batchId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Return History</h2>
            <button onClick={loadHistory} disabled={listLoading} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
              <RefreshCw size={16} className={listLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {listLoading ? <div className="flex items-center justify-center py-12"><RefreshCw size={32} className="animate-spin text-blue-600" /></div> :
            history.length === 0 ? <div className="text-center py-12 text-gray-500">No returns found</div> :
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map(ret => (
                    <tr key={ret.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(ret.returnDate).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.returnType}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{ret.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.batchId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{ret.reason}</td>
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
