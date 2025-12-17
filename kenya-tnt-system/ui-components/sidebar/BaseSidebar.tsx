"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useKeycloak } from "@/context/KeycloakProvider";
import { ModuleConfig } from "@/lib/moduleConfig";
import LoadingDots from "@/components/LoadingDots";
import logo from "../../public/tnt_sha_logo.svg";
import dhaLogo from "../../public/dha_logo.svg";
import { getSidebarIcon } from "../icons/SidebarIcons";

interface BaseSidebarProps {
  module: ModuleConfig;
}

export default function BaseSidebar({ module }: BaseSidebarProps) {
  const pathname = usePathname();
  const { hasModuleAccess, isAuthenticated, keycloak } = useKeycloak();
  const routes = module.routes;

  // Show loading state while Keycloak is initializing
  if (!keycloak) {
    return <LoadingDots />;
  }

  // If not authenticated or no module access, don't show sidebar
  if (!isAuthenticated || !hasModuleAccess(module.id)) {
    return null;
  }

  return (
    <div className="w-[300px] bg-white shadow-lg h-screen flex flex-col">
      {/* Sidebar Header with Logo and Branding */}
      <div className="flex items-center py-2 px-4 border-b border-gray-200">
        <div className="flex items-center justify-center bg-white h-16 w-full">
          <Image
            src={logo}
            alt="logo"
            className="h-auto w-auto object-contain"
            width={200}
            height={64}
            priority={true}
          />
        </div>
      </div>

      {/* Module Section Header */}
      <div className="px-4 py-1">
        <h2 className="text-sm  text-center font-semibold text-gray-700 uppercase">
          {module.id === "ppb"
            ? "PPB"
            : module.id === "cpa"
            ? "SUPPLIER"
            : module.id === "manufacturer"
            ? "MANUFACTURER"
            : "FACILITY"}
        </h2>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 px-2">
        <nav>
          <ul className="space-y-0">
            {routes.map((route) => {
              const isActive = pathname.includes(`/${module.id}${route.path}`);
              return (
                <li key={route.path}>
                  <Link
                    href={`/${module.id}${route.path}`}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-sky-800  border-r-4 border-sky-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {/* Icon using the new icon system */}
                    <div
                      className={`w-5 h-5 mr-4 ${
                        isActive ? "text-sky-700" : "text-gray-400"
                      }`}
                    >
                      {getSidebarIcon(route.icon, "w-full h-full")}
                    </div>
                    {route.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* DHA Logo at Bottom */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500 ">Powered by</div>
          <div className="w-full max-w-[400px] h-15 flex items-center justify-center">
            <Image
              src={dhaLogo}
              alt="DHA Digital Health Agency"
              className="max-h-full max-w-full object-contain"
              quality={100}
              priority={true}
              unoptimized={true}
              width={400}
              height={80}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
