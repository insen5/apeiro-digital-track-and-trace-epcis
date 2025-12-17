"use client";

import { FaBell, FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ModuleConfig } from "@/lib/moduleConfig";
import { useKeycloak } from "@/context/KeycloakProvider";

interface ModuleNavbarProps {
  module: ModuleConfig;
  actions?: React.ReactNode;
}

export default function ModuleNavbar({ module, actions }: ModuleNavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const pathname = usePathname();
  const { keycloak, userInfo } = useKeycloak();

  // Function to get page title from module config and pathname
  const getPageTitle = (path: string, moduleConfig: ModuleConfig) => {
    // Find the route that matches the current path
    const route = moduleConfig.routes.find((route) =>
      path.includes(route.path)
    );

    // Return the route name if found, otherwise "Dashboard"
    return route ? route.name : "Dashboard";
  };

  // Function to check if title should be shown
  const shouldShowTitle = (path: string, moduleConfig: ModuleConfig) => {
    // Manual list of routes that should SHOW the title (visible routes)
    const visibleRoutes = [
      "Dashboard",
      // "Aggregation",
      // "All Batches",
      // "Product Codes",
      // "Shipments",
      // Add more routes here that should show title
    ];

    // Find the route that matches the current path
    const route = moduleConfig.routes.find((route) =>
      path.includes(route.path)
    );

    // Check if current route should show title
    if (route) {
      return visibleRoutes.includes(route.name);
    }

    // Default to hiding title if no specific route found
    return false;
  };

  const handleLogOut = () => {
    if (keycloak) {
      keycloak.logout();
    }
  };

  const username = (userInfo?.preferred_username as string) || "User";
  const userEmail = (userInfo?.email as string) || "user@example.com";
  const userFullName = (userInfo?.name as string) || "User";

  // Calculate title and visibility directly on every render
  const currentTitle = getPageTitle(pathname, module);
  const showTitle = shouldShowTitle(pathname, module);

  return (
    <header className="bg-[#F4F7FE] px-6 py-3 shadow">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left Side - Page Title */}
        <div className="flex items-center space-x-8">
          {showTitle && (
            <h1 key={pathname} className="text-2xl font-bold text-gray-900">
              {currentTitle}
            </h1>
          )}
          {actions && (
            <div className="flex items-center space-x-4">{actions}</div>
          )}
        </div>

        {/* Right Side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <FaBell className="h-6 w-6" />
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-3 hover:bg-gray-50 border-b border-gray-100">
                    <p className="text-sm text-gray-800">
                      New batch received from Manufacturer A
                    </p>
                    <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                  </div>
                  <div className="p-3 hover:bg-gray-100 border-b border-gray-100">
                    <p className="text-sm text-gray-800">
                      Order #12345 has been processed
                    </p>
                    <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
                  </div>
                  <div className="p-3 hover:bg-gray-50">
                    <p className="text-sm text-gray-800">
                      System maintenance scheduled for tonight
                    </p>
                    <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                  </div>
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {userFullName}
                  </p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <div className="py-1">
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <FaUser className="h-4 w-4" />
                    Profile
                  </button>
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <FaCog className="h-4 w-4" />
                    Settings
                  </button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={handleLogOut}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FaSignOutAlt className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isNotificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false);
            setIsNotificationsOpen(false);
          }}
        />
      )}
    </header>
  );
}
