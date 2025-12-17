'use client';

import { Sidebar } from '@/components/ui/Sidebar';
import { Package, Truck, FileText, BarChart3, CheckCircle2, Database, Hospital, FolderOpen, HelpCircle, Trash2, Users } from 'lucide-react';

export default function RegulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarItems = [
    {
      label: 'Master Data',
      href: '#',
      icon: <FolderOpen className="w-4 h-4" />,
      children: [
        {
          label: 'Product Catalog',
          href: '/regulator/products',
          icon: <Package className="w-4 h-4" />,
        },
        {
          label: 'Premise Data',
          href: '/regulator/premise-data',
          icon: <Database className="w-4 h-4" />,
        },
        {
          label: 'Facility UAT Data',
          href: '/regulator/facility-uat-data',
          icon: <Hospital className="w-4 h-4" />,
        },
        {
          label: 'Facility Prod Data',
          href: '/regulator/facility-prod-data',
          icon: <Hospital className="w-4 h-4" />,
        },
        {
          label: 'Practitioners',
          href: '/regulator/practitioner-data',
          icon: <Users className="w-4 h-4" />,
        },
      ],
    },
    {
      label: 'PPB Approved Batches',
      href: '/regulator/ppb-batches',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      label: 'Journey Tracking',
      href: '/regulator/journey',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      label: 'Recalls',
      href: '/regulator/recall',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      label: 'Analytics',
      href: '/regulator/analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      label: 'System Management',
      href: '#',
      icon: <FolderOpen className="w-4 h-4" />,
      children: [
        {
          label: 'Help Management',
          href: '/regulator/help-management',
          icon: <HelpCircle className="w-4 h-4" />,
        },
        {
          label: 'Destruction Records',
          href: '/shared/destruction',
          icon: <Trash2 className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        items={sidebarItems} 
        title="Pharmacy and Poisons Board" 
        homeHref="/" 
        logoSrc="/gok_logo.png"
        logoAlt="Government of Kenya"
      />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}

