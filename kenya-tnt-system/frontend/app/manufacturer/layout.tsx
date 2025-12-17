'use client';

import { Sidebar } from '@/components/ui/Sidebar';
import { Box, Layers, Package, Truck, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

// Feature flag: Set to 'true' to enable production features (batches, cases, packages, shipments)
// Set to 'false' to hide them and only show PPB Consignments
const ENABLE_PRODUCTION = process.env.NEXT_PUBLIC_ENABLE_MANUFACTURER_PRODUCTION !== 'false';

export default function ManufacturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarItems = [
    // PPB Consignments - unified endpoint showing consignments with batches
    {
      label: 'PPB Consignments',
      href: '/manufacturer/consignments',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      label: 'Product Status',
      href: '/manufacturer/product-status',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    // DEPRECATED: PPB Approved Batches - batches are now shown within consignments
    // Keeping for backward compatibility but will be removed in future version
    // {
    //   label: 'PPB Approved Batches',
    //   href: '/manufacturer/ppb-batches',
    //   icon: <CheckCircle2 className="w-4 h-4" />,
    // },
    // Production features - conditionally visible
    ...(ENABLE_PRODUCTION
      ? [
          {
            label: 'Production',
            href: '#',
            icon: <Box className="w-4 h-4" />,
            children: [
              {
                label: 'Batches',
                href: '/manufacturer/batches',
                icon: <Box className="w-4 h-4" />,
              },
              {
                label: 'Cases',
                href: '/manufacturer/cases',
                icon: <Layers className="w-4 h-4" />,
              },
              {
                label: 'Packages',
                href: '/manufacturer/packages',
                icon: <Package className="w-4 h-4" />,
              },
            ],
          },
          {
            label: 'Shipments',
            href: '/manufacturer/shipments',
            icon: <Truck className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        items={sidebarItems} 
        title="Manufacturer" 
        homeHref="/" 
        logoSrc="/gok_logo.png"
        logoAlt="Government of Kenya"
      />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}
