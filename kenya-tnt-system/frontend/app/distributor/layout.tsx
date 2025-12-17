'use client';

import { Sidebar } from '@/components/ui/Sidebar';
import { Truck, ShoppingCart, Package, ArrowLeftRight } from 'lucide-react';

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarItems = [
    {
      label: 'Shipments',
      href: '#',
      icon: <Truck className="w-4 h-4" />,
      children: [
        {
          label: 'Received Shipments',
          href: '/distributor/shipments/received',
          icon: <Truck className="w-4 h-4" />,
        },
        {
          label: 'Forward Shipments',
          href: '/distributor/shipments/forward',
          icon: <ShoppingCart className="w-4 h-4" />,
        },
      ],
    },
    {
      label: 'Hierarchy Management',
      href: '/distributor/hierarchy',
      icon: <Package className="w-4 h-4" />,
    },
    {
      label: 'Return Logistics',
      href: '/distributor/returns',
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        items={sidebarItems} 
        title="Distributor" 
        homeHref="/" 
        logoSrc="/gok_logo.png"
        logoAlt="Government of Kenya"
      />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}

