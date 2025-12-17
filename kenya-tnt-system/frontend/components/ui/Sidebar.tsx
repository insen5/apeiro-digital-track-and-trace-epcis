"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronRight, 
  Package, 
  Truck, 
  FileText, 
  BarChart3,
  Box,
  Layers,
  ShoppingCart,
  Building2
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  title: string;
  homeHref?: string;
  logoSrc?: string;
  logoAlt?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, title, homeHref = '/', logoSrc, logoAlt }) => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggleSection = (label: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(label)) {
      newOpen.delete(label);
    } else {
      newOpen.add(label);
    }
    setOpenSections(newOpen);
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: SidebarItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4 border-b border-sidebar-border">
        <Link href={homeHref} className="flex items-center gap-2">
          {logoSrc ? (
            <Image src={logoSrc} alt={logoAlt || title} width={32} height={32} className="w-8 h-8 object-contain" />
          ) : (
            <Building2 className="w-6 h-6 text-sidebar-primary" />
          )}
          <span className="text-xl font-bold text-sidebar-foreground">{title}</span>
        </Link>
      </div>
      
      <nav className="p-4 space-y-1">
        {items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = openSections.has(item.label);
          const active = isParentActive(item);

          return (
            <div key={item.label}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-sidebar-border pl-4">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(child.href)
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

