'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Database, Hospital, Users, CheckCircle2, Truck, FileText, BarChart3, TrendingUp, AlertTriangle, Activity, Clock, Shield, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function RegulatorDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const quickStats = [
    {
      title: 'Total Products',
      value: '5,234',
      change: '+12%',
      trend: 'up',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Facilities',
      value: '12,345',
      change: 'UAT + Prod',
      trend: 'neutral',
      icon: Hospital,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Approved Batches',
      value: '342',
      change: '+18 this week',
      trend: 'up',
      icon: CheckCircle2,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Active Recalls',
      value: '12',
      change: '3 critical',
      trend: 'down',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  const featureCards = [
    {
      title: 'Master Data Management',
      description: 'Centralized control of products, facilities, and practitioners',
      icon: Database,
      gradient: 'from-blue-500 to-cyan-500',
      items: [
        { label: 'Product Catalog', href: '/regulator/products', count: '5.2K', status: 'healthy' },
        { label: 'Premise Data', href: '/regulator/premise-data', count: '1.8K', status: 'healthy' },
        { label: 'Facility UAT Data', href: '/regulator/facility-uat-data', count: '12.3K', status: 'healthy' },
        { label: 'Facility Prod Data', href: '/regulator/facility-prod-data', count: '10.1K', status: 'healthy' },
        { label: 'Practitioners', href: '/regulator/practitioner-data', count: '25.6K', status: 'warning' },
      ],
    },
    {
      title: 'Regulatory Oversight',
      description: 'Monitor compliance, approvals, and enforcement actions',
      icon: Shield,
      gradient: 'from-green-500 to-emerald-500',
      items: [
        { label: 'PPB Approved Batches', href: '/regulator/ppb-batches', count: '342', status: 'healthy' },
        { label: 'Active Recalls', href: '/regulator/recall', count: '12', status: 'critical' },
        { label: 'Journey Tracking', href: '/regulator/journey', count: 'Live', status: 'healthy' },
      ],
    },
    {
      title: 'Analytics & Insights',
      description: 'Real-time monitoring and data quality reports',
      icon: BarChart3,
      gradient: 'from-purple-500 to-pink-500',
      items: [
        { label: 'System Analytics', href: '/regulator/analytics', count: 'View', status: 'healthy' },
        { label: 'Quality Reports', href: '/regulator/facility-uat-data', count: '87.3%', status: 'healthy' },
      ],
    },
  ];

  const systemStatus = [
    { label: 'PPB API Sync', status: 'online', time: '2 hours ago', icon: Activity, color: 'text-green-600' },
    { label: 'Facility Data Quality', status: 'good', score: '87.3%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'EPCIS Events', status: 'processing', queue: '23 events', icon: Clock, color: 'text-yellow-600' },
    { label: 'Database Health', status: 'optimal', uptime: '99.9%', icon: Database, color: 'text-green-600' },
  ];

  const recentActivity = [
    { action: 'New batch approved', entity: 'Paracetamol 500mg', time: '5 min ago', type: 'success' },
    { action: 'Quality alert triggered', entity: 'Facility #12345', time: '23 min ago', type: 'warning' },
    { action: 'Product catalog sync', entity: 'PPB API', time: '2 hours ago', type: 'info' },
    { action: 'Recall initiated', entity: 'Amoxicillin Batch #A123', time: '3 hours ago', type: 'critical' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Pharmacy and Poisons Board
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Regulatory oversight and master data management for Kenya's pharmaceutical supply chain
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index} 
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${mounted ? 'animate-in slide-in-from-bottom' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`h-2 bg-gradient-to-r ${stat.color}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="flex items-center mt-2">
                    {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600 mr-1" />}
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {featureCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card 
                key={index} 
                className={`border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group ${mounted ? 'animate-in slide-in-from-bottom' : ''}`}
                style={{ animationDelay: `${(index + 4) * 100}ms` }}
              >
                <div className={`h-1 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="bg-gradient-to-br from-white to-gray-50/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">{card.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">{card.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-2">
                    {card.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <Link
                          href={item.href}
                          className="group/item flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50 transition-all duration-200 border border-transparent hover:border-blue-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              item.status === 'healthy' ? 'bg-green-500' :
                              item.status === 'warning' ? 'bg-yellow-500' :
                              item.status === 'critical' ? 'bg-red-500 animate-pulse' :
                              'bg-gray-400'
                            }`} />
                            <span className="text-sm font-medium text-gray-700 group-hover/item:text-blue-700">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                              {item.count}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover/item:text-blue-600 group-hover/item:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* System Status & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <Card className={`border-0 shadow-lg overflow-hidden ${mounted ? 'animate-in slide-in-from-left' : ''}`}>
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <CardTitle>System Status</CardTitle>
              </div>
              <CardDescription>Real-time monitoring of all system components</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {systemStatus.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${item.color}`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500">
                            {item.time || item.score || item.queue || item.uptime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'online' || item.status === 'good' || item.status === 'optimal' ? 'bg-green-500 animate-pulse' :
                          item.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                          'bg-gray-400'
                        }`} />
                        <span className="text-xs font-medium text-gray-600 capitalize">{item.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className={`border-0 shadow-lg overflow-hidden ${mounted ? 'animate-in slide-in-from-right' : ''}`}>
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>Latest system events and actions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-gray-200 transition-all"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' :
                      activity.type === 'critical' ? 'bg-red-500 animate-pulse' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{activity.entity}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Bar */}
        <Card className={`mt-8 border-0 shadow-lg overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 ${mounted ? 'animate-in slide-in-from-bottom' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <Sparkles className="w-6 h-6" />
                <div>
                  <p className="font-semibold text-lg">Need help navigating the system?</p>
                  <p className="text-sm text-blue-100">Access documentation, guides, and support resources</p>
                </div>
              </div>
              <Link 
                href="/regulator/help-management"
                className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 shadow-lg"
              >
                <span>View Help Center</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
