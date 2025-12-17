'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authStorage } from "@/lib/api/auth";
import { showToast } from "@/lib/toast";
import { LogIn, LogOut, User, Scan, Package, TruckIcon, FileText, BarChart3 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const user = authStorage.getUser();
    setCurrentUser(user);
  }, []);

  const handleLogout = () => {
    authStorage.removeUser();
    setCurrentUser(null);
    showToast.success('Logged out successfully');
  };

  const getRoleHomePage = (role: string) => {
    switch (role) {
      case 'dha':
        return '/regulator/ppb-batches';
      case 'manufacturer':
        return '/manufacturer/batches';
      case 'cpa':
        return '/distributor/shipments';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Top Bar with User Info */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-end">
          {currentUser ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">{currentUser.organization}</span>
                <span className="text-gray-500">({currentUser.email})</span>
              </div>
              <Button
                onClick={() => router.push(getRoleHomePage(currentUser.role))}
                variant="outline"
                size="sm"
                  className="hover:bg-blue-50"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                  className="hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => router.push('/login')}
              size="sm"
                className="bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          )}
        </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section with Branding */}
        <div className="text-center mb-16">
          {/* Partner Logos */}
          <div className="flex justify-center items-center gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <Image
                src="/dha.jpeg"
                alt="Digital Health Agency"
                width={300}
                height={120}
                className="w-auto h-24 object-contain"
                priority
              />
            </div>
            
            <div className="text-4xl text-gray-300">×</div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <Image
                src="/tc.jpeg"
                alt="TaifaCare"
                width={300}
                height={120}
                className="w-auto h-24 object-contain"
                priority
              />
            </div>
          </div>

          {/* Main Title */}
          <div className="relative">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-blue-500 to-green-600 bg-clip-text text-transparent">
            Kenya TNT System
          </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-blue-600 to-green-600 mx-auto rounded-full mb-4"></div>
          </div>
          <p className="text-2xl text-gray-700 mb-4 font-medium">
            National Track & Trace System
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ensuring pharmaceutical supply chain integrity and authenticity across Kenya
          </p>
        </div>

        {/* Modules Grid */}
        <div className="max-w-6xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            System Modules
          </h2>
            
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/regulator/products" className="block group">
                <ModuleCard
                  title="Pharmacy and Poisons Board"
                  description="Product catalog, journey tracking, recall management, system administration"
                icon={
                  <div className="w-8 h-8 relative">
                    <Image src="/gok_logo.png" alt="Government of Kenya" width={32} height={32} className="object-contain" />
                  </div>
                }
                color="blue"
                  endpoints={[
                    "/regulator/products",
                    "/regulator/ppb-batches",
                    "/regulator/journey",
                    "/regulator/recall",
                    "/regulator/analytics",
                    "/regulator/premise-data",
                    "/regulator/facility-prod-data",
                    "/regulator/facility-uat-data",
                    "/regulator/help-management",
                    "/shared/destruction",
                  ]}
                />
              </Link>
              
            <Link href="/manufacturer/batches" className="block group">
                <ModuleCard
                  title="Manufacturer"
                  description="Batch, case, package, and shipment management"
                icon={
                  <div className="w-8 h-8 relative">
                    <Image src="/gok_logo.png" alt="Government of Kenya" width={32} height={32} className="object-contain" />
                  </div>
                }
                color="green"
                  endpoints={[
                    "/manufacturer/consignments",
                    "/manufacturer/product-status",
                    "/manufacturer/batches",
                    "/manufacturer/cases",
                    "/manufacturer/packages",
                    "/manufacturer/shipments",
                  ]}
                />
              </Link>
              
            <Link href="/distributor/shipments" className="block group">
                <ModuleCard
                  title="Distributor"
                  description="Receive and forward shipments, manage returns and hierarchy"
                icon={<TruckIcon className="w-8 h-8" />}
                color="purple"
                  endpoints={[
                    "/distributor/shipments",
                    "/distributor/hierarchy",
                    "/distributor/returns",
                  ]}
                />
              </Link>
            
            <Link href="/scanner" className="block group">
              <ModuleCard
                title="Public App"
                description="GS1 barcode scanner - no authentication required"
                icon={<Scan className="w-8 h-8" />}
                color="orange"
                endpoints={[
                  "/scanner",
                ]}
              />
            </Link>
              
              <a
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"}/docs`}
                target="_blank"
                rel="noopener noreferrer"
              className="block group"
              >
                <ModuleCard
                  title="API Documentation"
                  description="Swagger UI for API exploration"
                icon={<FileText className="w-8 h-8" />}
                color="gray"
                  endpoints={[
                    "/api/docs",
                    "/api/health",
                    "/api/demo",
                  ]}
                />
              </a>
            </div>
          </div>

        {/* Quick Links Section */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl shadow-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">Quick Access</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/scanner"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-center transition-all hover:scale-105"
              >
                <div className="text-3xl mb-2">📱</div>
                <div className="font-medium">Barcode Scanner</div>
              </Link>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-center transition-all hover:scale-105"
                >
                <div className="text-3xl mb-2">📚</div>
                <div className="font-medium">API Docs</div>
                </a>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"}/health`}
                  target="_blank"
                  rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-center transition-all hover:scale-105"
                >
                <div className="text-3xl mb-2">❤️</div>
                <div className="font-medium">Health Check</div>
                </a>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"}/demo/architecture`}
                  target="_blank"
                  rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-center transition-all hover:scale-105"
                >
                <div className="text-3xl mb-2">🏗️</div>
                <div className="font-medium">Architecture</div>
                </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600">
          <p className="text-sm">
            Powered by Digital Health Agency & TaifaCare
          </p>
          <p className="text-xs mt-2">
            © 2025 Kenya Track & Trace System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  endpoints,
  icon,
  color = 'blue',
}: {
  title: string;
  description: string;
  endpoints: string[];
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700',
    green: 'from-green-500 to-green-600 group-hover:from-green-600 group-hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 group-hover:from-purple-600 group-hover:to-purple-700',
    orange: 'from-orange-500 to-orange-600 group-hover:from-orange-600 group-hover:to-orange-700',
    gray: 'from-gray-500 to-gray-600 group-hover:from-gray-600 group-hover:to-gray-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group-hover:-translate-y-1 cursor-pointer h-full">
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-6 text-white`}>
        <div className="flex items-center justify-between mb-3">
          {icon && <div className="opacity-90">{icon}</div>}
        </div>
        <h3 className="font-bold text-xl mb-2">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
      <div className="p-4">
        <div className="text-xs text-gray-600">
          <div className="font-semibold mb-2 text-gray-900">Available Pages:</div>
          <ul className="space-y-1">
          {endpoints.map((endpoint, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                <span className="font-mono text-xs">{endpoint}</span>
            </li>
          ))}
        </ul>
        </div>
      </div>
    </div>
  );
}
