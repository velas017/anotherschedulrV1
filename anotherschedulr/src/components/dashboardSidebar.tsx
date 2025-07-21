"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  CalendarDays,
  BarChart3,
  Menu,
  X,
  LogOut,
  User,
  Clock
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
}

interface DashboardSidebarProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  mobileMenuOpen = false, 
  setMobileMenuOpen 
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const userDisplayName = session?.user?.name || session?.user?.email || "User";
  const userEmail = session?.user?.email || "";

  const navigationItems: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Appointments", href: "/dashboard/appointments", icon: Clock },
    { name: "Clients", href: "/dashboard/clients", icon: Users },
    { name: "Services", href: "/dashboard/services", icon: FileText },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <Link href="/" className={`font-bold text-xl text-gray-900 ${!sidebarOpen && 'hidden lg:hidden'}`}>
          anotherschedulr
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded hover:bg-gray-100 hidden lg:block"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileMenuOpen?.(false)}
          className="p-1 rounded hover:bg-gray-100 lg:hidden"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Overview
        </div>
        
        {navigationItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`ml-3 ${!sidebarOpen && 'hidden lg:hidden'}`}>{item.name}</span>
            </Link>
          );
        })}

        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-6 mb-3">
          Manage
        </div>

        {navigationItems.slice(2, -1).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`ml-3 ${!sidebarOpen && 'hidden lg:hidden'}`}>{item.name}</span>
            </Link>
          );
        })}

        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-6 mb-3">
          Business Settings
        </div>

        {navigationItems.slice(-1).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`ml-3 ${!sidebarOpen && 'hidden lg:hidden'}`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center lg:justify-center'}`}>
          {session?.user?.image ? (
            <img 
              src={session.user.image} 
              alt={userDisplayName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
          )}
          {(sidebarOpen || !sidebarOpen) && (
            <div className={`flex-1 ${!sidebarOpen && 'hidden lg:hidden'}`}>
              <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
          )}
          {(sidebarOpen || !sidebarOpen) && (
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`p-1 rounded hover:bg-gray-100 ${!sidebarOpen && 'hidden lg:hidden'}`}
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 hidden lg:flex lg:flex-col`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen?.(false)}></div>
        <aside className="fixed inset-y-0 left-0 w-64 bg-white flex flex-col">
          <SidebarContent />
        </aside>
      </div>
    </>
  );
};

export default DashboardSidebar;