'use client';

import { useState } from 'react';
import { FileBarChart, BarChart3, CheckCircle, History } from 'lucide-react';
import PremiseCatalogTab from './components/PremiseCatalogTab';
import DataAnalysisTab from './components/DataAnalysisTab';
import DataQualityTab from './components/DataQualityTab';
import AuditHistoryTab from './components/AuditHistoryTab';

type TabType = 'catalog' | 'analysis' | 'quality' | 'audit-history';

export default function PremiseDataPage() {
  const [activeTab, setActiveTab] = useState<TabType>('catalog');

  const tabs = [
    { id: 'catalog' as TabType, label: 'Premise Catalogue', icon: FileBarChart },
    { id: 'analysis' as TabType, label: 'Data Analysis', icon: BarChart3 },
    { id: 'quality' as TabType, label: 'Data Quality Report', icon: CheckCircle },
    { id: 'audit-history' as TabType, label: 'Audit History', icon: History },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Premise Data</h1>
        <p className="text-gray-600">
          View and manage pharmaceutical premise registrations
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 flex items-center gap-2 font-medium transition-colors relative ${
                  isActive
                    ? 'text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'catalog' && <PremiseCatalogTab />}
      {activeTab === 'analysis' && <DataAnalysisTab />}
      {activeTab === 'quality' && <DataQualityTab />}
      {activeTab === 'audit-history' && <AuditHistoryTab />}
    </div>
  );
}
