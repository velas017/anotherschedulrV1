"use client";

import React, { useState } from 'react';
import DashboardSidebar from '@/components/dashboardSidebar';
import { Bell, Menu, User, Clock, Users, DollarSign, CalendarDays, ChevronRight, UserCheck, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

const DemoPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Demo user data
  const demoUser = {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    image: null
  };

  // Demo stats
  const statsCards = [
    {
      title: "Today's Appointments",
      value: "12",
      icon: Clock,
      change: "+3 from yesterday",
      changeType: "increase",
    },
    {
      title: "Total Clients",
      value: "156",
      icon: Users,
      change: "+8 this month",
      changeType: "increase",
    },
    {
      title: "Monthly Revenue",
      value: "$8,240",
      icon: DollarSign,
      change: "+12% from last month",
      changeType: "increase",
    },
    {
      title: "Upcoming This Week",
      value: "45",
      icon: CalendarDays,
      change: "Next 7 days",
      changeType: "neutral",
    },
  ];

  // Demo appointments
  const recentAppointments = [
    {
      id: 1,
      client: "Emma Wilson",
      service: "60 Minute Deep Tissue Massage",
      time: "9:00 AM",
      status: "confirmed",
      duration: "1h",
    },
    {
      id: 2,
      client: "Michael Chen",
      service: "Haircut & Style",
      time: "10:30 AM",
      status: "confirmed",
      duration: "45min",
    },
    {
      id: 3,
      client: "Lisa Rodriguez",
      service: "Facial Treatment",
      time: "1:00 PM",
      status: "pending",
      duration: "1.5h",
    },
    {
      id: 4,
      client: "David Thompson",
      service: "Personal Training Session",
      time: "3:30 PM",
      status: "confirmed",
      duration: "1h",
    },
    {
      id: 5,
      client: "Jennifer Brown",
      service: "Yoga Class",
      time: "5:00 PM",
      status: "confirmed",
      duration: "1.5h",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium z-50">
        🎯 This is a demo dashboard with sample data. <Link href="/signup" className="underline font-semibold">Sign up to get started!</Link>
      </div>

      <DashboardSidebar 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden pt-10">
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
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Welcome back, {demoUser.name}!
                  </h1>
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
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {demoUser.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
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
                  <span className="text-sm text-gray-500 flex items-center">
                    Demo Data
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </span>
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
              <div className="bg-blue-600 text-white rounded-lg p-6 cursor-not-allowed opacity-75">
                <Calendar className="w-8 h-8 mb-3" />
                <h3 className="text-lg font-semibold">Schedule Appointment</h3>
                <p className="text-blue-100 text-sm mt-1">Sign up to book appointments</p>
              </div>
              
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 cursor-not-allowed opacity-75">
                <Users className="w-8 h-8 mb-3 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
                <p className="text-gray-600 text-sm mt-1">Sign up to manage clients</p>
              </div>
              
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 cursor-not-allowed opacity-75">
                <FileText className="w-8 h-8 mb-3 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">View Reports</h3>
                <p className="text-gray-600 text-sm mt-1">Sign up to see analytics</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
              <p className="text-blue-100 mb-6">
                This is just a preview! Sign up now to create your own business dashboard with real data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/signup" 
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Sign Up Free
                </Link>
                <Link 
                  href="/" 
                  className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DemoPage;