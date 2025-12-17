'use client';

import { useState, useEffect, useRef } from 'react';
import { regulatorApi, ShipmentJourney } from '@/lib/api/regulator';
import { Button } from '@/components/ui/button';
import SSCCBarcode from '@/components/SSCCBarcode';
import SankeyDiagram from '@/components/SankeyDiagram';
import { Truck, Package, Box, Calendar, MapPin, Building2, User, CheckCircle2, Clock, ArrowRight, TrendingUp, Network, ChevronDown, ChevronUp, Navigation, Globe, Hash, Activity, RefreshCw, Radio } from 'lucide-react';

interface JourneyEvent {
  eventId: string;
  eventType: string;
  eventTime: string;
  bizStep?: string;
  disposition?: string;
  action?: string;
  actorType?: string;
  actorOrganization?: string;
  actorUser?: any;
  shipment?: any;
  epcs?: string[];
}

interface JourneyData {
  sscc?: string;
  events?: JourneyEvent[];
  manufacturer?: {
    shipping: JourneyEvent[];
    receiving: JourneyEvent[];
    returns: JourneyEvent[];
  };
  supplier?: {
    shipping: JourneyEvent[];
    receiving: JourneyEvent[];
    returns: JourneyEvent[];
  };
  userFacility?: {
    shipping: JourneyEvent[];
    receiving: JourneyEvent[];
    returns: JourneyEvent[];
  };
}

export default function JourneyPage() {
  const [sscc, setSscc] = useState('123456789012345678');
  const [consignmentID, setConsignmentID] = useState('CONS-2025-001');
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [consignmentFlowData, setConsignmentFlowData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [consignmentLoading, setConsignmentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sscc' | 'consignment'>('sscc');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleTrack = async () => {
    if (!sscc.trim()) {
      setError('Please enter an SSCC');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await regulatorApi.journey.trackBySSCC(sscc.trim());
      setJourneyData(data as JourneyData);
      setLastUpdateTime(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to track journey');
      setJourneyData(null);
    } finally {
      setLoading(false);
    }
  };

  // Real-time polling effect
  useEffect(() => {
    if (isRealTimeEnabled && sscc.trim() && !loading) {
      // Poll every 5 seconds
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const data = await regulatorApi.journey.trackBySSCC(sscc.trim());
          setJourneyData(data as JourneyData);
          setLastUpdateTime(new Date());
        } catch (err: any) {
          console.error('Polling error:', err);
          // Don't show error on polling failures, just log
        }
      }, 5000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [isRealTimeEnabled, sscc, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleConsignmentFlow = async () => {
    if (!consignmentID.trim()) {
      setError('Please enter a consignment ID');
      return;
    }

    try {
      setConsignmentLoading(true);
      setError(null);
      const data = await regulatorApi.journey.getConsignmentFlow(consignmentID.trim());
      setConsignmentFlowData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to get consignment flow');
      setConsignmentFlowData(null);
    } finally {
      setConsignmentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Journey Tracking
          </h1>
          <p className="text-gray-600">Track shipments and view complete product journey details</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sscc')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'sscc'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            SSCC Journey Tracking
          </button>
          <button
            onClick={() => setActiveTab('consignment')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'consignment'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Consignment Flow Visualization
          </button>
        </div>

        {/* SSCC Search Card */}
        {activeTab === 'sscc' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6 backdrop-blur-sm">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter SSCC (Serial Shipping Container Code)
                </label>
                <input
                  type="text"
                  value={sscc}
                  onChange={(e) => setSscc(e.target.value)}
                  placeholder="Enter 18-digit SSCC"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                />
              </div>
              <Button 
                onClick={handleTrack} 
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                {loading ? 'Tracking...' : 'Track Journey'}
              </Button>
            </div>
          </div>
        )}

        {/* Consignment Flow Search Card */}
        {activeTab === 'consignment' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6 backdrop-blur-sm">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter Consignment ID
                </label>
                <input
                  type="text"
                  value={consignmentID}
                  onChange={(e) => setConsignmentID(e.target.value)}
                  placeholder="Enter consignment ID (e.g., CONS-2025-001)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-mono"
                  onKeyPress={(e) => e.key === 'Enter' && handleConsignmentFlow()}
                />
              </div>
              <Button 
                onClick={handleConsignmentFlow} 
                disabled={consignmentLoading}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                {consignmentLoading ? 'Loading...' : 'View Flow'}
              </Button>
            </div>
          </div>
        )}


        {/* SSCC Journey Results */}
        {activeTab === 'sscc' && journeyData && (
          <div className="space-y-6">
            {/* Journey Timeline Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Event Timeline</h2>
              </div>
              
              {journeyData.sscc && (
                <div className="mb-6 p-4 bg-white rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">SSCC Code</p>
                  <p className="text-xl font-mono font-bold text-blue-600 mb-3">{journeyData.sscc}</p>
                  <SSCCBarcode sscc={journeyData.sscc} />
                </div>
              )}

              {/* Real-time Status */}
              {journeyData && (
                <div className="mb-6 flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                        isRealTimeEnabled
                          ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Radio className={`w-4 h-4 ${isRealTimeEnabled ? 'animate-pulse' : ''}`} />
                      {isRealTimeEnabled ? 'Real-time: ON' : 'Real-time: OFF'}
                    </button>
                    {lastUpdateTime && (
                      <span className="text-sm text-gray-600">
                        Last updated: {lastUpdateTime.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleTrack}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Now
                  </Button>
                </div>
              )}

              {/* Event Timeline - Collect all events from main array and grouped sections */}
              {(() => {
                // Collect all events from all sources
                const allEvents: JourneyEvent[] = [];
                
                // Add events from main events array
                if (journeyData.events && journeyData.events.length > 0) {
                  allEvents.push(...journeyData.events);
                }
                
                // Add events from grouped sections (manufacturer, supplier, userFacility)
                if (journeyData.manufacturer) {
                  if (journeyData.manufacturer.shipping) allEvents.push(...journeyData.manufacturer.shipping);
                  if (journeyData.manufacturer.receiving) allEvents.push(...journeyData.manufacturer.receiving);
                  if (journeyData.manufacturer.returns) allEvents.push(...journeyData.manufacturer.returns);
                }
                if (journeyData.supplier) {
                  if (journeyData.supplier.shipping) allEvents.push(...journeyData.supplier.shipping);
                  if (journeyData.supplier.receiving) allEvents.push(...journeyData.supplier.receiving);
                  if (journeyData.supplier.returns) allEvents.push(...journeyData.supplier.returns);
                }
                if (journeyData.userFacility) {
                  if (journeyData.userFacility.shipping) allEvents.push(...journeyData.userFacility.shipping);
                  if (journeyData.userFacility.receiving) allEvents.push(...journeyData.userFacility.receiving);
                  if (journeyData.userFacility.returns) allEvents.push(...journeyData.userFacility.returns);
                }
                
                // Remove duplicates by eventId and sort by eventTime
                const uniqueEvents = Array.from(
                  new Map(allEvents.map(event => [event.eventId, event])).values()
                ).sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());
                
                if (uniqueEvents.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-semibold">No events found</p>
                      <p className="text-sm mt-1">No journey events have been recorded for this SSCC yet.</p>
                    </div>
                  );
                }
                
                return (
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-indigo-400"></div>
                    
                    {uniqueEvents.map((event, idx) => {
                    const isExpanded = expandedEvents.has(event.eventId);
                    const hasLocation = (event as any).latitude && (event as any).longitude;
                    const hasEPCs = event.epcs && event.epcs.length > 0;
                    
                    return (
                      <div key={event.eventId} className="relative flex items-start gap-4 mb-6">
                        <div className={`relative z-10 p-2 rounded-full ${
                          event.bizStep === 'shipping' ? 'bg-blue-500' :
                          event.bizStep === 'receiving' ? 'bg-green-500' :
                          event.bizStep === 'returns' ? 'bg-red-500' :
                          'bg-gray-500'
                        } shadow-lg`}>
                          {event.bizStep === 'shipping' ? (
                            <Truck className="w-5 h-5 text-white" />
                          ) : event.bizStep === 'receiving' ? (
                            <Package className="w-5 h-5 text-white" />
                          ) : (
                            <Clock className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                          {/* Main Event Card */}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                <h3 className="font-bold text-gray-800">
                                  {event.actorOrganization || (event as any).actorUser?.organization || 'Unknown Organization'}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                  event.actorType === 'manufacturer' ? 'bg-blue-100 text-blue-700' :
                                  event.actorType === 'supplier' ? 'bg-green-100 text-green-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {event.actorType || 'Unknown'}
                                </span>
                                <button
                                  onClick={() => toggleEventExpansion(event.eventId)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors group relative"
                                  title={isExpanded ? "Click to collapse details" : "Click to expand for full event details"}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  )}
                                  <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {isExpanded ? "Collapse" : "Expand details"}
                                  </span>
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold text-gray-700">Step:</span>
                                <span className="text-gray-800 capitalize">{event.bizStep || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-gray-700">Status:</span>
                                <span className="text-gray-800 capitalize">{event.disposition || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(event.eventTime).toLocaleString('en-US', { 
                                  weekday: 'long',
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </span>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                {/* Event Type & Action */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs font-semibold text-blue-700 mb-1">Event Type</p>
                                    <p className="text-sm font-medium text-gray-800">{event.eventType || 'N/A'}</p>
                                  </div>
                                  {(event as any).action && (
                                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                      <p className="text-xs font-semibold text-indigo-700 mb-1">Action</p>
                                      <p className="text-sm font-medium text-gray-800 capitalize">{(event as any).action}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Location Information */}
                                {((event as any).readPointId || (event as any).bizLocationId || hasLocation) && (
                                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                    <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      Location Information
                                    </p>
                                    <div className="space-y-1 text-sm">
                                      {(event as any).readPointId && (
                                        <p><span className="font-semibold">Read Point:</span> <span className="font-mono text-xs">{(event as any).readPointId}</span></p>
                                      )}
                                      {(event as any).bizLocationId && (
                                        <p><span className="font-semibold">Business Location:</span> <span className="font-mono text-xs">{(event as any).bizLocationId}</span></p>
                                      )}
                                      {hasLocation && (
                                        <div className="mt-2 p-2 bg-white rounded border border-green-200">
                                          <p className="text-xs font-semibold text-gray-700 mb-1">Coordinates</p>
                                          <p className="font-mono text-xs text-gray-800">
                                            Lat: {(event as any).latitude}, Lng: {(event as any).longitude}
                                          </p>
                                          <a
                                            href={`https://www.google.com/maps?q=${(event as any).latitude},${(event as any).longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:text-blue-800"
                                          >
                                            <Globe className="w-3 h-3" />
                                            View on Map
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Actor Details */}
                                {(event as any).actorUser && (
                                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                    <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      Actor Details
                                    </p>
                                    <div className="space-y-1 text-sm">
                                      {(event as any).actorUser.organization && (
                                        <p><span className="font-semibold">Organization:</span> {(event as any).actorUser.organization}</p>
                                      )}
                                      {(event as any).actorUser.email && (
                                        <p><span className="font-semibold">Email:</span> {(event as any).actorUser.email}</p>
                                      )}
                                      {(event as any).actorUser.glnNumber && (
                                        <p><span className="font-semibold">GLN:</span> <span className="font-mono text-xs">{(event as any).actorUser.glnNumber}</span></p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* EPCs */}
                                {hasEPCs && (
                                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                                      <Hash className="w-3 h-3" />
                                      Associated EPCs ({event.epcs!.length})
                                    </p>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                      {event.epcs!.slice(0, 10).map((epc, epcIdx) => (
                                        <p key={epcIdx} className="text-xs font-mono bg-white p-1 rounded border border-amber-200">
                                          {epc}
                                        </p>
                                      ))}
                                      {event.epcs!.length > 10 && (
                                        <p className="text-xs text-gray-500 italic">... and {event.epcs!.length - 10} more</p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Shipment Details */}
                                {(event as any).shipment && (
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Shipment Details</p>
                                    <div className="space-y-1 text-sm">
                                      {(event as any).shipment.customer && (
                                        <p><span className="font-semibold">Customer:</span> {(event as any).shipment.customer}</p>
                                      )}
                                      {(event as any).shipment.carrier && (
                                        <p><span className="font-semibold">Carrier:</span> {(event as any).shipment.carrier}</p>
                                      )}
                                      {(event as any).shipment.destinationAddress && (
                                        <p><span className="font-semibold">Destination:</span> {(event as any).shipment.destinationAddress}</p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Event ID */}
                                <div className="p-2 bg-gray-100 rounded border border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    <span className="font-semibold">Event ID:</span> <span className="font-mono">{event.eventId}</span>
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                );
              })()}

              {/* Grouped by Actor Type - Enhanced */}
              {(journeyData.manufacturer || journeyData.supplier || journeyData.userFacility) && (
                <div className="mt-8 space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Event Summary by Actor</h3>
                  
                  {journeyData.manufacturer && (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-blue-800 text-lg flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          Manufacturer Events
                        </h3>
                        <span className="text-sm text-blue-600 font-semibold">
                          Total: {(journeyData.manufacturer.shipping?.length || 0) + 
                                  (journeyData.manufacturer.receiving?.length || 0) + 
                                  (journeyData.manufacturer.returns?.length || 0)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Truck className="w-5 h-5 text-blue-600" />
                            <span className="text-2xl font-bold text-blue-700">
                              {journeyData.manufacturer.shipping?.length || 0}
                            </span>
                          </div>
                          <p className="font-semibold text-blue-800">Shipping</p>
                          {journeyData.manufacturer.shipping && journeyData.manufacturer.shipping.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Latest: {new Date(journeyData.manufacturer.shipping[journeyData.manufacturer.shipping.length - 1].eventTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Package className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-700">
                              {journeyData.manufacturer.receiving?.length || 0}
                            </span>
                          </div>
                          <p className="font-semibold text-green-800">Receiving</p>
                          {journeyData.manufacturer.receiving && journeyData.manufacturer.receiving.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Latest: {new Date(journeyData.manufacturer.receiving[journeyData.manufacturer.receiving.length - 1].eventTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-red-300 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <ArrowRight className="w-5 h-5 text-red-600 rotate-180" />
                            <span className="text-2xl font-bold text-red-700">
                              {journeyData.manufacturer.returns?.length || 0}
                            </span>
                          </div>
                          <p className="font-semibold text-red-800">Returns</p>
                          {journeyData.manufacturer.returns && journeyData.manufacturer.returns.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Latest: {new Date(journeyData.manufacturer.returns[journeyData.manufacturer.returns.length - 1].eventTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {journeyData.supplier && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-green-800 text-lg flex items-center gap-2">
                          <Network className="w-5 h-5" />
                          Supplier/Distributor Events
                        </h3>
                        <span className="text-sm text-green-600 font-semibold">
                          Total: {(journeyData.supplier.shipping?.length || 0) + 
                                  (journeyData.supplier.receiving?.length || 0) + 
                                  (journeyData.supplier.returns?.length || 0)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Truck className="w-5 h-5 text-blue-600" />
                            <span className="text-2xl font-bold text-blue-700">
                              {journeyData.supplier.shipping?.length || 0}
                            </span>
                          </div>
                          <p className="font-semibold text-blue-800">Shipping</p>
                          {journeyData.supplier.shipping && journeyData.supplier.shipping.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Latest: {new Date(journeyData.supplier.shipping[journeyData.supplier.shipping.length - 1].eventTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Package className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-700">
                              {journeyData.supplier.receiving?.length || 0}
                            </span>
                          </div>
                          <p className="font-semibold text-green-800">Receiving</p>
                          {journeyData.supplier.receiving && journeyData.supplier.receiving.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Latest: {new Date(journeyData.supplier.receiving[journeyData.supplier.receiving.length - 1].eventTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-red-300 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <ArrowRight className="w-5 h-5 text-red-600 rotate-180" />
                            <span className="text-2xl font-bold text-red-700">
                              {journeyData.supplier.returns?.length || 0}
                            </span>
                          </div>
                          <p className="font-semibold text-red-800">Returns</p>
                          {journeyData.supplier.returns && journeyData.supplier.returns.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Latest: {new Date(journeyData.supplier.returns[journeyData.supplier.returns.length - 1].eventTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {journeyData.userFacility && (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border-2 border-amber-200 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-amber-800 text-lg flex items-center gap-2">
                          <Box className="w-5 h-5" />
                          Facility Events
                        </h3>
                        <span className="text-sm text-amber-600 font-semibold">
                          Total: {(journeyData.userFacility.shipping?.length || 0) + 
                                  (journeyData.userFacility.receiving?.length || 0) + 
                                  (journeyData.userFacility.returns?.length || 0)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Truck className="w-5 h-5 text-blue-600" />
                            <span className="text-2xl font-bold text-blue-700">
                              {journeyData.userFacility.shipping?.length || 0}
                            </span>
                          </div>
                          <p className="font-semibold text-blue-800">Shipping</p>
                          {journeyData.userFacility.shipping && journeyData.userFacility.shipping.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Latest: {new Date(journeyData.userFacility.shipping[journeyData.userFacility.shipping.length - 1].eventTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Package className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-700">
                              {journeyData.userFacility.receiving?.length || 0}
                            </span>
                          </div>
                          <p className="font-semibold text-green-800">Receiving</p>
                          {journeyData.userFacility.receiving && journeyData.userFacility.receiving.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Latest: {new Date(journeyData.userFacility.receiving[journeyData.userFacility.receiving.length - 1].eventTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="bg-white rounded-lg p-4 border-2 border-red-300 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <ArrowRight className="w-5 h-5 text-red-600 rotate-180" />
                            <span className="text-2xl font-bold text-red-700">
                              {journeyData.userFacility.returns?.length || 0}
                            </span>
                          </div>
                          <p className="font-semibold text-red-800">Returns</p>
                          {journeyData.userFacility.returns && journeyData.userFacility.returns.length > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Latest: {new Date(journeyData.userFacility.returns[journeyData.userFacility.returns.length - 1].eventTime).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consignment Flow Visualization */}
        {activeTab === 'consignment' && consignmentFlowData && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Network className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Consignment Flow: {consignmentFlowData.consignmentID}</h2>
              </div>
              
              <SankeyDiagram
                nodes={consignmentFlowData.nodes || []}
                links={consignmentFlowData.links || []}
                summary={consignmentFlowData.summary}
              />
            </div>
          </div>
        )}

        {/* Legacy shipment display (fallback) */}
        {activeTab === 'sscc' && journeyData && !journeyData.events && (journeyData as any).manufacturer && typeof (journeyData as any).manufacturer.ssccBarcode !== 'undefined' && (
          <div className="space-y-6">
            {/* Journey Timeline Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Journey Timeline</h2>
              </div>
              
              <div className="mb-6 p-4 bg-white rounded-lg border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-2 font-semibold">SSCC Code</p>
                <p className="text-xl font-mono font-bold text-blue-600 mb-3">{(journeyData as any).manufacturer.ssccBarcode}</p>
                <SSCCBarcode sscc={(journeyData as any).manufacturer.ssccBarcode} />
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-indigo-400"></div>
                
                {/* Pickup Step */}
                <div className="relative flex items-start gap-4 mb-6">
                  <div className={`relative z-10 p-2 rounded-full ${(journeyData as any).manufacturer.isDispatched ? 'bg-green-500' : 'bg-yellow-500'} shadow-lg`}>
                    {(journeyData as any).manufacturer.isDispatched ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Clock className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-4 shadow-md border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-gray-800">Pickup Location</h3>
                    </div>
                    <p className="text-gray-700 font-medium">{(journeyData as any).manufacturer.pickupLocation}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date((journeyData as any).manufacturer.pickupDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* In Transit */}
                <div className="relative flex items-start gap-4 mb-6">
                  <div className="relative z-10 p-2 rounded-full bg-blue-500 shadow-lg">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-4 shadow-md border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-gray-800">In Transit</h3>
                    </div>
                    <p className="text-gray-700 font-medium">{(journeyData as any).manufacturer.carrier}</p>
                    <p className="text-sm text-gray-500 mt-1">Carrying {(journeyData as any).manufacturer.packages?.length || 0} package(s)</p>
                  </div>
                </div>

                {/* Delivery Step */}
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 p-2 rounded-full bg-indigo-500 shadow-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-4 shadow-md border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-bold text-gray-800">Destination</h3>
                    </div>
                    <p className="text-gray-700 font-medium">{(journeyData as any).manufacturer.destinationAddress}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Expected: {new Date((journeyData as any).manufacturer.expectedDeliveryDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Info Cards */}
            {(journeyData as any).manufacturer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer & Carrier Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Shipment Details
                  </h3>
                  <div className="space-y-4">
                    {(journeyData as any).manufacturer.customer && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-gray-500 mb-1">Customer</p>
                        <p className="font-bold text-gray-800">{(journeyData as any).manufacturer.customer}</p>
                      </div>
                    )}
                    {(journeyData as any).manufacturer.carrier && (
                      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                        <p className="text-xs text-gray-500 mb-1">Carrier</p>
                        <p className="font-bold text-gray-800">{(journeyData as any).manufacturer.carrier}</p>
                      </div>
                    )}
                    {(journeyData as any).manufacturer.isDispatched !== undefined && (
                      <div className={`p-3 rounded-lg border ${(journeyData as any).manufacturer.isDispatched ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${(journeyData as any).manufacturer.isDispatched ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></span>
                          <p className={`font-bold ${(journeyData as any).manufacturer.isDispatched ? 'text-green-700' : 'text-yellow-700'}`}>
                            {(journeyData as any).manufacturer.isDispatched ? 'Dispatched' : 'Pending Dispatch'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manufacturer Card */}
                {(journeyData as any).manufacturer.userId && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                      <User className="w-5 h-5 text-blue-600" />
                      Manufacturer
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Organization</p>
                        <p className="font-bold text-gray-800">{(journeyData as any).manufacturer.userId?.organization || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="font-medium text-gray-700">{(journeyData as any).manufacturer.userId?.email || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                        <p className="text-xs text-gray-500 mb-1">GLN Number</p>
                        <p className="font-mono font-bold text-blue-600">{(journeyData as any).manufacturer.userId?.glnNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Packages & Contents */}
            {(journeyData as any).manufacturer?.packages && (journeyData as any).manufacturer.packages.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  Packages & Contents
                </h3>
                <div className="space-y-6">
                  {(journeyData as any).manufacturer.packages.map((pkg: any, pkgIdx: number) => (
                    <div key={pkg.id || pkgIdx} className="border-2 border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-lg text-gray-800">{pkg.label}</h4>
                        {pkg.isDispatched !== undefined && (
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                            pkg.isDispatched 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          }`}>
                            {pkg.isDispatched ? '✓ Dispatched' : '⏳ Pending'}
                          </span>
                        )}
                      </div>

                      {pkg.cases && pkg.cases.length > 0 && (
                        <div className="ml-4 space-y-4 border-l-2 border-blue-300 pl-6">
                          {pkg.cases.map((caseItem: any) => (
                            <div key={caseItem.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <Box className="w-4 h-4 text-indigo-600" />
                                <h5 className="font-semibold text-gray-800">{caseItem.label}</h5>
                              </div>

                              {caseItem.products && caseItem.products.length > 0 && (
                                <div className="ml-4 space-y-3">
                                  {caseItem.products.map((productItem: any) => (
                                    <div key={productItem.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</p>
                                            <p className="font-bold text-gray-800 text-lg">{productItem.product?.productName || 'N/A'}</p>
                                            <p className="text-sm text-gray-600">{productItem.product?.brandName || ''}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">GTIN</p>
                                            <p className="font-mono font-bold text-blue-600">{productItem.product?.gtin || 'N/A'}</p>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Batch</p>
                                            <p className="font-bold text-gray-800">{productItem.batch?.batchno || 'N/A'}</p>
                                            {productItem.batch?.expiry && (
                                              <p className="text-xs text-gray-600">
                                                Expiry: <span className="font-semibold">{new Date(productItem.batch.expiry).toLocaleDateString()}</span>
                                              </p>
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</p>
                                            <p className="font-bold text-2xl text-indigo-600">{productItem.qty || 0} <span className="text-sm text-gray-600">units</span></p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

