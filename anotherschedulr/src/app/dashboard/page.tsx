"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  Bell,
  ChevronRight,
  Clock,
  DollarSign,
  UserCheck,
  CalendarDays,
  Menu,
  X,
  LogOut,
  User
} from "lucide-react";

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debug logging
  console.log("🔍 Dashboard - Session status:", status);
  console.log("🔍 Dashboard - Session data:", session);
  console.log("🔍 Dashboard - User:", session?.user);

  if (status === "loading") {
    console.log("🔍 Dashboard - Loading session...");
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    console.log("🔍 Dashboard - No session found, showing access denied");
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to access the dashboard</p>
          <div className="space-y-3">
            <Link href="/signin" className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Sign In
            </Link>
            <Link href="/signup" className="block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Sign Up
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Session Status: {status} | Has Session: {session ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const userDisplayName = session.user?.name || "User";
  const userEmail = session.user?.email || "";

  console.log("🔍 Dashboard - Rendering dashboard for user:", userDisplayName);

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, active: true },
    { name: "Appointments", href: "/dashboard/appointments", icon: Calendar, active: false },
    { name: "Clients", href: "/dashboard/clients", icon: Users, active: false },
    { name: "Calendar", href: "/dashboard/calendar", icon: CalendarDays, active: false },
    { name: "Services", href: "/dashboard/services", icon: FileText, active: false },
    { name: "Reports", href: "/dashboard/reports", icon: FileText, active: false },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, active: false },
  ];

  const statsCards = [
    {
      title: "Today's Appointments",
      value: "8",
      icon: Clock,
      change: "+2 from yesterday",
      changeType: "increase",
    },
    {
      title: "Total Clients",
      value: "248",
      icon: Users,
      change: "+12 this month",
      changeType: "increase",
    },
    {
      title: "Monthly Revenue",
      value: "$12,426",
      icon: DollarSign,
      change: "+8% from last month",
      changeType: "increase",
    },
    {
      title: "Upcoming This Week",
      value: "32",
      icon: CalendarDays,
      change: "Next 7 days",
      changeType: "neutral",
    },
  ];

  const recentAppointments = [
    {
      id: 1,
      client: "Sarah Johnson",
      service: "Hair Cut & Style",
      time: "10:00 AM",
      status: "confirmed",
      duration: "1h",
    },
    {
      id: 2,
      client: "Michael Chen",
      service: "Deep Tissue Massage",
      time: "11:30 AM",
      status: "confirmed",
      duration: "1.5h",
    },
    {
      id: 3,
      client: "Emma Davis",
      service: "Manicure & Pedicure",
      time: "2:00 PM",
      status: "pending",
      duration: "2h",
    },
    {
      id: 4,
      client: "James Wilson",
      service: "Consultation",
      time: "4:00 PM",
      status: "confirmed",
      duration: "30m",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 hidden lg:block`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link href="/" className={`font-bold text-xl text-gray-900 ${!sidebarOpen && 'hidden'}`}>
              anotherschedulr
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-200 p-4">
            <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
              {session.user?.image ? (
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
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
              )}
              {sidebarOpen && (
                <button 
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
        <aside className="fixed inset-y-0 left-0 w-64 bg-white">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Link href="/" className="font-bold text-xl text-gray-900">
                anotherschedulr
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="ml-3">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                {session.user?.image ? (
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
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
                  <p className="text-xs text-gray-500">{userEmail}</p>
                </div>
                <button 
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {userDisplayName}!</h1>
                  <p className="text-sm text-gray-500 mt-1">Here's what's happening with your business today.</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-gray-100">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {/* User Avatar */}
                {session.user?.image ? (
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
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className={`text-xs font-medium ${
                        stat.changeType === 'increase' ? 'text-green-600' : 
                        stat.changeType === 'decrease' ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Appointments */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
                  <Link href="/dashboard/appointments" className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                    View all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAppointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{appointment.client}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {appointment.service}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {appointment.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {appointment.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/dashboard/appointments/new" className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors">
                <Calendar className="w-8 h-8 mb-3" />
                <h3 className="text-lg font-semibold">Schedule Appointment</h3>
                <p className="text-blue-100 text-sm mt-1">Book a new appointment for a client</p>
              </Link>
              
              <Link href="/dashboard/clients/new" className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <Users className="w-8 h-8 mb-3 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
                <p className="text-gray-600 text-sm mt-1">Register a new client to your database</p>
              </Link>
              
              <Link href="/dashboard/reports" className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <FileText className="w-8 h-8 mb-3 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">View Reports</h3>
                <p className="text-gray-600 text-sm mt-1">Check your business analytics</p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;