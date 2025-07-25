"use client";

import Link from "next/link";
import DashboardLayout from "@/components/dashboardLayout";
import { 
  Calendar, 
  Users, 
  FileText,
  ChevronRight,
  Clock,
  DollarSign,
  UserCheck,
  CalendarDays
} from "lucide-react";

const DashboardPage = () => {
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
    <DashboardLayout
      subtitle="Here's what's happening with your business today."
    >
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
    </DashboardLayout>
  );
};

export default DashboardPage;