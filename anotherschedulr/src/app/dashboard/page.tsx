"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboardLayout";
import { 
  Calendar, 
  Users, 
  FileText,
  ChevronRight,
  Clock,
  UserCheck,
  CalendarDays,
  Loader2,
  TrendingUp,
  RefreshCw
} from "lucide-react";

interface DashboardStats {
  todayAppointments: number;
  currentMonthAppointments: number;
  upcomingThisWeek: number;
}

interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  loading?: boolean;
}

interface AppointmentDisplay {
  id: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  startTime: string;
  endTime: string;
  status: string;
  title: string;
}

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    currentMonthAppointments: 0,
    upcomingThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [todayAppointmentsList, setTodayAppointmentsList] = useState<AppointmentDisplay[]>([]);

  // Helper function to get today's date range
  const getTodayDateRange = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    return {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    };
  };

  // Helper function to get current month's date range
  const getCurrentMonthDateRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return {
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString()
    };
  };

  // Helper function to get current week's date range (Sunday to Saturday)
  const getCurrentWeekDateRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate days to subtract to get to Sunday
    const daysToSunday = dayOfWeek; 
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToSunday);
    
    // Saturday is 6 days after Sunday
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - dayOfWeek), 23, 59, 59, 999);
    
    return {
      startDate: startOfWeek.toISOString(),
      endDate: endOfWeek.toISOString()
    };
  };

  // Helper function to format time (e.g., "10:00 AM")
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to format duration (e.g., "1h 30m")
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  // Fetch today's appointments count
  const fetchTodayAppointments = useCallback(async () => {
    try {
      const { startDate, endDate } = getTodayDateRange();
      const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      
      const appointments = await response.json();
      return appointments.length;
    } catch (error) {
      console.error('Error fetching today&apos;s appointments:', error);
      throw error;
    }
  }, []);

  // Fetch current month's appointments count
  const fetchCurrentMonthAppointments = useCallback(async () => {
    try {
      const { startDate, endDate } = getCurrentMonthDateRange();
      const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      
      const appointments = await response.json();
      return appointments.length;
    } catch (error) {
      console.error('Error fetching current month&apos;s appointments:', error);
      throw error;
    }
  }, []);

  // Fetch current week's appointments count (Sunday to Saturday)
  const fetchCurrentWeekAppointments = useCallback(async () => {
    try {
      const { startDate, endDate } = getCurrentWeekDateRange();
      const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch weekly appointments');
      }
      
      const appointments = await response.json();
      return appointments.length;
    } catch (error) {
      console.error('Error fetching current week&apos;s appointments:', error);
      throw error;
    }
  }, []);

  // Fetch today's full appointment list with details
  const fetchTodayAppointmentsList = useCallback(async () => {
    try {
      const { startDate, endDate } = getTodayDateRange();
      const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointment details');
      }
      
      const appointments: AppointmentDisplay[] = await response.json();
      return appointments;
    } catch (error) {
      console.error('Error fetching today&apos;s appointment list:', error);
      throw error;
    }
  }, []);

  // Load dashboard data function
  const loadDashboardData = useCallback(async () => {
    if (status === 'loading') return;
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [todayCount, currentMonthAppointmentsCount, currentWeekAppointmentsCount, todayAppointments] = await Promise.all([
        fetchTodayAppointments(),
        fetchCurrentMonthAppointments(),
        fetchCurrentWeekAppointments(),
        fetchTodayAppointmentsList()
      ]);

      setStats({
        todayAppointments: todayCount,
        currentMonthAppointments: currentMonthAppointmentsCount,
        upcomingThisWeek: currentWeekAppointmentsCount,
      });
      setTodayAppointmentsList(todayAppointments);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [status, session?.user, fetchTodayAppointments, fetchCurrentMonthAppointments, fetchCurrentWeekAppointments, fetchTodayAppointmentsList]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Page visibility and focus refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user) {
        loadDashboardData();
      }
    };

    const handleWindowFocus = () => {
      if (session?.user) {
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadDashboardData, session?.user]);

  // Router navigation refresh
  useEffect(() => {
    const handleRouteChange = () => {
      if (session?.user) {
        // Small delay to ensure the page has loaded
        setTimeout(() => {
          loadDashboardData();
        }, 100);
      }
    };

    // Refresh data when navigating to this page
    handleRouteChange();
  }, [router, loadDashboardData, session?.user]);

  const statsCards: StatCard[] = [
    {
      title: "Today's Appointments",
      value: loading ? "..." : stats.todayAppointments.toString(),
      icon: Clock,
      change: loading ? "Loading..." : stats.todayAppointments === 1 ? "1 appointment today" : `${stats.todayAppointments} appointments today`,
      changeType: "neutral",
      loading,
    },
    {
      title: "This Month's Appointments",
      value: loading ? "..." : stats.currentMonthAppointments.toString(),
      icon: CalendarDays,
      change: loading ? "Loading..." : stats.currentMonthAppointments === 1 ? "1 appointment this month" : `${stats.currentMonthAppointments} appointments this month`,
      changeType: "neutral",
      loading,
    },
    {
      title: "Upcoming This Week",
      value: loading ? "..." : stats.upcomingThisWeek.toString(),
      icon: TrendingUp,
      change: loading ? "Loading..." : stats.upcomingThisWeek === 1 ? "1 appointment this week" : `${stats.upcomingThisWeek} appointments this week`,
      changeType: "neutral",
      loading,
    },
  ];

  return (
    <DashboardLayout
      subtitle="Here's what's happening with your business today."
    >
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    {stat.loading ? (
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6 text-blue-600" />
                    )}
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
              <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Appointments</h2>
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
                {todayAppointmentsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <CalendarDays className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No appointments scheduled for today</p>
                        <p className="text-sm mt-1">Book your first appointment for today</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  todayAppointmentsList.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName}` : 'Unknown Client'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {appointment.service?.name || appointment.title || 'No Service'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatTime(appointment.startTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDuration(appointment.service?.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'CONFIRMED' || appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'CANCELLED' || appointment.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : appointment.status === 'COMPLETED' || appointment.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.status === 'NO_SHOW' || appointment.status === 'no_show'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
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