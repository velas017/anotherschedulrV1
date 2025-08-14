"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboardLayout';
import NewAppointmentPanel from '@/components/newAppointmentPanel';
import BlockOffTimePanel from '@/components/blockOffTimePanel';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Clock,
  ChevronDown,
  Printer,
  Calendar,
  CalendarDays
} from 'lucide-react';
import { parseBusinessHours, isWithinBusinessHours, isTimeBlocked } from '@/lib/availability';
import type { BusinessHours, BlockedTime } from '@/lib/availability';

// Hook for responsive breakpoint detection
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
};

// Appointment interface for TypeScript
interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

const CalendarPage = () => {
  // Responsive breakpoint detection
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month' | 'day'>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAppointmentPanelOpen, setIsAppointmentPanelOpen] = useState(false);
  const [isBlockOffTimePanelOpen, setIsBlockOffTimePanelOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [isLoadingBusinessHours, setIsLoadingBusinessHours] = useState(true);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [focusedAppointmentId, setFocusedAppointmentId] = useState<string | null>(null);
  // const [selectedTimeSlot, setSelectedTimeSlot] = useState<{date: Date, time: string} | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch business hours, blocked times, and appointments on component mount
  useEffect(() => {
    fetchBusinessHours();
    fetchBlockedTimes();
    fetchAppointments();
  }, [currentDate, viewType]);

  // Debug: Log when business hours state changes to verify re-renders
  useEffect(() => {
    console.log('[DEBUG] Business hours state changed:', {
      businessHours,
      isEmpty: Object.keys(businessHours).length === 0,
      isLoading: isLoadingBusinessHours
    });
  }, [businessHours, isLoadingBusinessHours]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsViewDropdownOpen(false);
      }
    };

    if (isViewDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isViewDropdownOpen]);

  // Fetch business hours from the API
  const fetchBusinessHours = async () => {
    try {
      console.log('[DEBUG] Starting to fetch business hours...');
      setIsLoadingBusinessHours(true);
      const response = await fetch('/api/scheduling-page');
      
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Scheduling page data received:', data);
        const hours = parseBusinessHours(data.businessHours);
        console.log('[DEBUG] Parsed business hours:', hours);
        setBusinessHours(hours);
      } else {
        console.log('[DEBUG] API failed, using default business hours');
        // Use default business hours if API fails
        const defaultHours = parseBusinessHours(null);
        console.log('[DEBUG] Default business hours:', defaultHours);
        setBusinessHours(defaultHours);
      }
    } catch (error) {
      console.error('[DEBUG] Error fetching business hours:', error);
      const defaultHours = parseBusinessHours(null);
      console.log('[DEBUG] Error fallback business hours:', defaultHours);
      setBusinessHours(defaultHours);
    } finally {
      console.log('[DEBUG] Business hours loading complete');
      setIsLoadingBusinessHours(false);
    }
  };

  // Fetch blocked times from the API
  const fetchBlockedTimes = async () => {
    try {
      // Calculate date range based on current view
      let startDate, endDate;
      
      if (viewType === 'week') {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        startDate = weekStart.toISOString();
        endDate = weekEnd.toISOString();
      } else if (viewType === 'month') {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        startDate = monthStart.toISOString();
        endDate = monthEnd.toISOString();
      } else {
        // Day view
        startDate = new Date(currentDate.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(currentDate.setHours(23, 59, 59, 999)).toISOString();
      }

      const response = await fetch(`/api/blocked-time?startDate=${startDate}&endDate=${endDate}`);
      
      if (response.ok) {
        const data = await response.json();
        setBlockedTimes(data);
      }
    } catch (error) {
      console.error('Error fetching blocked times:', error);
    }
  };

  // Fetch appointments from the API
  const fetchAppointments = async () => {
    try {
      setIsLoadingAppointments(true);
      
      // Calculate date range based on current view
      let startDate, endDate;
      
      if (viewType === 'week') {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        startDate = weekStart.toISOString();
        endDate = weekEnd.toISOString();
      } else if (viewType === 'month') {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        startDate = monthStart.toISOString();
        endDate = monthEnd.toISOString();
      } else {
        // Day view
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        startDate = dayStart.toISOString();
        endDate = dayEnd.toISOString();
      }

      const response = await fetch(`/api/appointments?startDate=${startDate}&endDate=${endDate}`);
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        console.error('Failed to fetch appointments');
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Generate hourly time slots (no more 30-minute intervals)
  const generateTimeSlotsForView = () => {
    const slots = [];
    for (let hour = 8; hour <= 22; hour++) { // 8 AM to 10 PM
      let displayTime;
      if (hour === 12) {
        displayTime = '12 PM';
      } else if (hour > 12) {
        displayTime = `${hour - 12} PM`;
      } else {
        displayTime = `${hour} AM`;
      }
      slots.push(displayTime);
    }
    return slots;
  };

  const timeSlots = generateTimeSlotsForView();

  // Calculate precise position and height for appointments
  const calculateAppointmentStyle = (startTime: string, endTime: string, hourHeight: number = 60) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    
    // Calculate position from 8 AM (first hour slot)
    const baseHour = 8;
    const hourOffset = startHour - baseHour;
    const minuteOffset = startMinute / 60;
    const top = (hourOffset + minuteOffset) * hourHeight;
    
    // Calculate height based on duration with mobile-responsive minimum
    const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
    const naturalHeight = (durationMinutes / 60) * hourHeight;
    
    // Mobile-responsive minimum heights to ensure all content fits
    const minHeight = isMobile ? 75 : 68; // Larger minimum on mobile for touch targets
    const height = Math.max(naturalHeight, minHeight);
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      position: 'absolute' as const,
      left: '4px',
      right: '4px',
      zIndex: 10
    };
  };

  // Get appointments for a specific day, filtered by business hours availability
  const getAppointmentsForDay = (dayIndex: number) => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);
    
    // Always apply business hours filtering - use defaults if not loaded yet
    const effectiveBusinessHours = Object.keys(businessHours).length > 0 
      ? businessHours 
      : parseBusinessHours(null); // Use default business hours if empty
    
    const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][targetDate.getDay()];
    const dayHours = effectiveBusinessHours[dayKey];
    
    // CRITICAL DEBUG: Log date calculations and comparisons
    console.log(`[CRITICAL DEBUG] getAppointmentsForDay(${dayIndex}) calculations:`, {
      dayIndex,
      currentDate: currentDate.toDateString(),
      weekStart: weekStart.toDateString(),
      targetDate: targetDate.toDateString(),
      targetDateDay: targetDate.getDate(),
      targetDateMonth: targetDate.getMonth(),
      targetDateYear: targetDate.getFullYear(),
      dayKey,
      isDayOpen: dayHours?.open
    });
    
    // If day is marked as unavailable (open: false), return no appointments
    if (!dayHours?.open) {
      console.log(`[DEBUG] ${dayKey} is closed - returning no appointments`);
      return [];
    }
    
    console.log(`[DEBUG] ${dayKey} is open - proceeding with appointment filtering`);
    
    const dayAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      const matches = appointmentDate.getDate() === targetDate.getDate() &&
                     appointmentDate.getMonth() === targetDate.getMonth() &&
                     appointmentDate.getFullYear() === targetDate.getFullYear();
      
      // CRITICAL DEBUG: Log each appointment comparison for Saturday specifically
      if (dayIndex === 6 || appointment.client?.name?.includes('Lisa Williams') || appointment.client?.name?.includes('Emily Rodriguez')) {
        console.log(`[CRITICAL DEBUG] Appointment date comparison for ${dayKey}:`, {
          appointmentId: appointment.id,
          clientName: appointment.client?.name,
          appointmentStartTime: appointment.startTime,
          appointmentDate: appointmentDate.toDateString(),
          appointmentDay: appointmentDate.getDate(),
          appointmentMonth: appointmentDate.getMonth(),
          appointmentYear: appointmentDate.getFullYear(),
          appointmentDayOfWeek: appointmentDate.getDay(),
          targetDateDay: targetDate.getDate(),
          targetDateMonth: targetDate.getMonth(), 
          targetDateYear: targetDate.getFullYear(),
          targetDayOfWeek: targetDate.getDay(),
          matches,
          dayIndex
        });
      }
      
      return matches;
    });
    
    // CRITICAL DEBUG: Log final results for Saturday and problem appointments
    if (dayIndex === 6) {
      console.log(`[CRITICAL DEBUG] Saturday final results:`, {
        dayIndex: 6,
        targetDate: targetDate.toDateString(),
        totalAppointmentsChecked: appointments.length,
        matchingAppointments: dayAppointments.length,
        appointmentDetails: dayAppointments.map(apt => ({
          id: apt.id,
          clientName: apt.client?.name,
          startTime: apt.startTime,
          dayOfWeek: new Date(apt.startTime).getDay()
        }))
      });
    }
    
    return dayAppointments;
  };

  // Check if a time slot should be disabled based on business hours and blocked times
  const isTimeSlotAvailable = (date: Date, timeSlot: string) => {
    // Always apply business hours filtering - use defaults if not loaded yet
    const effectiveBusinessHours = Object.keys(businessHours).length > 0 
      ? businessHours 
      : parseBusinessHours(null); // Use default business hours if empty

    // Convert time slot string to hour
    let hour = 0;
    
    // Parse hourly time slots like "8 AM" or "2 PM"
    const timeMatch = timeSlot.match(/^(\d{1,2})\s*(AM|PM)$/i);
    if (timeMatch) {
      hour = parseInt(timeMatch[1]);
      const isPM = timeMatch[2].toLowerCase() === 'pm';
      
      if (isPM && hour !== 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }
    }

    // Create a date object for this time slot (beginning of the hour)
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);

    // Check if blocked
    if (isTimeBlocked(slotDate, blockedTimes)) {
      return { available: false, reason: 'blocked' };
    }

    // Check business hours
    if (!isWithinBusinessHours(slotDate, effectiveBusinessHours)) {
      return { available: false, reason: 'outside-hours' };
    }

    return { available: true, reason: null };
  };

  // Get dates for the current week
  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    // Set to Sunday of the current week
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      week.push({
        date: day,
        dayName: day.toLocaleDateString('en-US', { weekday: 'long' }),
        dayNameShort: day.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day.getDate(),
        month: day.toLocaleDateString('en-US', { month: 'short' }),
        monthLong: day.toLocaleDateString('en-US', { month: 'long' }),
        year: day.getFullYear(),
        isToday: isToday(day),
        dateString: `${day.toLocaleDateString('en-US', { month: 'short' })} ${day.getDate()}`
      });
    }
    
    return week;
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Get dates for the current month
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const dates = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      dates.push({
        date: currentDate,
        day: day,
        isToday: isToday(currentDate),
        isCurrentMonth: true
      });
    }
    
    // Fill remaining cells to complete the grid
    const totalCells = Math.ceil(dates.length / 7) * 7;
    const remainingCells = totalCells - dates.length;
    for (let i = 1; i <= remainingCells; i++) {
      dates.push(null);
    }
    
    return dates;
  };

  // Check if current week is being viewed
  const isCurrentWeek = () => {
    const today = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return today >= weekStart && today <= weekEnd;
  };

  const weekDates = getWeekDates(currentDate);

  // Helper function to format appointment time display - clean format with no spaces
  const formatAppointmentTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const formatTime = (date: Date) => {
      const hour = date.getHours();
      const minute = date.getMinutes();
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      
      // Always show minutes for consistency
      const displayMinute = `:${minute.toString().padStart(2, '0')}`;
      return `${displayHour}${displayMinute}${ampm}`;
    };
    
    // NO SPACES around dash to match screenshot format: "2:15PM-3:25PM"
    return `${formatTime(start)}-${formatTime(end)}`;
  };

  // Check if appointment conflicts with business hours
  const isAppointmentInBusinessHours = (appointment: Appointment): boolean => {
    // Always apply business hours validation - use defaults if not loaded yet
    const effectiveBusinessHours = Object.keys(businessHours).length > 0 
      ? businessHours 
      : parseBusinessHours(null); // Use default business hours (Saturday closed)
    
    console.log('[DEBUG] Checking appointment business hours:', {
      appointmentId: appointment.id,
      startTime: appointment.startTime,
      dayOfWeek: new Date(appointment.startTime).getDay(),
      businessHoursLoaded: Object.keys(businessHours).length > 0,
      isLoadingBusinessHours
    });
    
    const startTime = new Date(appointment.startTime);
    const isValid = isWithinBusinessHours(startTime, effectiveBusinessHours);
    
    if (!isValid) {
      console.warn('[BUSINESS HOURS VIOLATION] Appointment outside business hours:', {
        appointmentId: appointment.id,
        clientName: appointment.client?.name,
        startTime: appointment.startTime,
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][startTime.getDay()]
      });
    }
    
    return isValid;
  };

  // Get appointment colors based on status or service
  const getAppointmentColor = (appointment: Appointment) => {
    // Check if appointment is outside business hours
    if (!isAppointmentInBusinessHours(appointment)) {
      return 'bg-yellow-200 border-yellow-400 text-yellow-800'; // Warning color for out-of-hours appointments
    }
    
    switch (appointment.status) {
      case 'CONFIRMED':
        return 'bg-green-200 border-green-300 text-green-800';
      case 'CANCELLED':
        return 'bg-red-200 border-red-300 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-200 border-blue-300 text-blue-800';
      default:
        return 'bg-orange-200 border-orange-300 text-orange-800';
    }
  };

  const formatCurrentPeriod = () => {
    if (viewType === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const month = weekStart.toLocaleDateString('en-US', { month: 'long' });
      const day = weekStart.getDate();
      const year = weekStart.getFullYear();
      return `Week of ${month} ${day}, ${year}`;
    } else if (viewType === 'month') {
      const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
      const year = currentDate.getFullYear();
      return `${month} ${year}`;
    } else if (viewType === 'day') {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
      const day = currentDate.getDate();
      const year = currentDate.getFullYear();
      return `${dayName}, ${month} ${day}, ${year}`;
    }
    return '';
  };

  // Handle appointment refresh after changes
  const handleAppointmentChange = () => {
    fetchAppointments();
  };

  // Handle time slot click for new appointment creation
  const handleTimeSlotClick = (day: { date: Date; dayNameShort: string; isToday: boolean }, timeSlot: string) => {
    // Clear focused appointment when clicking on time slots
    setFocusedAppointmentId(null);
    
    const availability = isTimeSlotAvailable(day.date, timeSlot);
    if (availability.available) {
      // setSelectedTimeSlot({ date: day.date, time: timeSlot });
      setIsAppointmentPanelOpen(true);
    }
  };

  // Calculate overlapping appointments for better positioning
  const getOverlappingAppointments = (appointment: Appointment, dayAppointments: Appointment[]) => {
    const appointmentStart = new Date(appointment.startTime);
    const appointmentEnd = new Date(appointment.endTime);
    
    return dayAppointments.filter(apt => {
      if (apt.id === appointment.id) return false;
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      
      // Check for actual overlap (not just touching)
      // Appointments that touch (end = start) should NOT be considered overlapping
      return (
        (appointmentStart < aptEnd && appointmentEnd > aptStart)
      );
    });
  };

  // Go to today's date
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <DashboardLayout
      title={formatCurrentPeriod()}
      subtitle={`${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}${viewType === 'week' && isCurrentWeek() ? ' • current week' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Calendar Controls Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsBlockOffTimePanelOpen(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <Clock className="mr-2 h-4 w-4" />
                BLOCK OFF TIME
              </button>
              
              <button 
                onClick={() => setIsAppointmentPanelOpen(true)}
                className="flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                ADD NEW
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <button 
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (viewType === 'week') {
                      newDate.setDate(currentDate.getDate() - 7);
                    } else if (viewType === 'month') {
                      newDate.setMonth(currentDate.getMonth() - 1);
                    } else if (viewType === 'day') {
                      newDate.setDate(currentDate.getDate() - 1);
                    }
                    setCurrentDate(newDate);
                  }}
                  className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                
                <button 
                  onClick={goToToday}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                >
                  TODAY
                </button>
                
                <button 
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (viewType === 'week') {
                      newDate.setDate(currentDate.getDate() + 7);
                    } else if (viewType === 'month') {
                      newDate.setMonth(currentDate.getMonth() + 1);
                    } else if (viewType === 'day') {
                      newDate.setDate(currentDate.getDate() + 1);
                    }
                    setCurrentDate(newDate);
                  }}
                  className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <div ref={dropdownRef} className="relative">
                  <button 
                    onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                    className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded border cursor-pointer"
                  >
                    {viewType === 'week' && 'Week View'}
                    {viewType === 'month' && 'Month View'}
                    {viewType === 'day' && 'Day View'}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  
                  {isViewDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          setViewType('day');
                          setIsViewDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Day View
                      </button>
                      <button
                        onClick={() => {
                          setViewType('week');
                          setIsViewDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Week View
                      </button>
                      <button
                        onClick={() => {
                          setViewType('month');
                          setIsViewDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Month View
                      </button>
                    </div>
                  )}
                </div>
                
                <button className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded border cursor-pointer">
                  All calendars
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
                <button className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded border cursor-pointer">
                  1x
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded cursor-pointer">
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white overflow-hidden">
          {viewType === 'week' && (
            <div className="h-full flex flex-col overflow-x-hidden">
              <div className="grid border-b border-gray-300 bg-gray-800" style={{ gridTemplateColumns: '120px repeat(7, 1fr)' }}>
                {/* Time column with timezone */}
                <div className="border-r border-gray-600 p-3 flex flex-col items-center justify-center text-white">
                  <div className="text-xs font-medium opacity-75">GMT-04</div>
                </div>
                
                {/* Day headers with enhanced styling */}
                {weekDates.map((day, index) => (
                  <div 
                    key={index} 
                    className={`border-r border-gray-600 p-3 text-center ${
                      day.isToday ? 'bg-gray-700' : 'bg-gray-800'
                    }`}
                  >
                    <div className={`text-sm font-medium uppercase tracking-wide ${
                      day.isToday ? 'text-blue-300' : 'text-white'
                    }`}>
                      {day.dayNameShort.toUpperCase()}
                    </div>
                    <div className={`text-lg font-bold mt-1 ${
                      day.isToday 
                        ? 'bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' 
                        : 'text-white'
                    }`}>
                      {day.dayNumber}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time slots and appointment grid with precise positioning */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Time grid */}
                <div 
                  className="relative"
                  style={{ height: `${timeSlots.length * 60}px` }}
                  onClick={(e) => {
                    // Clear focused appointment when clicking on calendar background
                    if (e.target === e.currentTarget) {
                      setFocusedAppointmentId(null);
                    }
                  }}
                >
                  {timeSlots.map((time, timeIndex) => (
                    <div key={timeIndex} className="grid border-b border-gray-100 absolute" 
                         style={{ 
                           gridTemplateColumns: '120px repeat(7, 1fr)',
                           height: '60px',
                           top: `${timeIndex * 60}px`,
                           width: '100%',
                           maxWidth: '100%',
                           left: 0,
                           right: 0
                         }}>
                      {/* Time label */}
                      <div className="border-r border-gray-200 bg-gray-50 px-3 py-1 text-right flex items-start justify-end">
                        <span className="text-sm font-medium text-gray-700 leading-tight">{time}</span>
                      </div>
                      
                      {/* Day columns */}
                      {weekDates.map((day, dayIndex) => {
                        const availability = isTimeSlotAvailable(day.date, time);
                        return (
                          <div 
                            key={dayIndex} 
                            className={`day-column border-r border-gray-100 relative transition-colors ${
                              day.isToday ? 'bg-blue-50/30' : ''
                            } ${!availability.available ? (availability.reason === 'blocked' ? 'bg-red-50/50' : 'bg-gray-100/50') : ''} hover:bg-gray-50/80 cursor-pointer`}
                            onClick={() => handleTimeSlotClick(day, time)}
                          >
                            {/* Show unavailable indicator */}
                            {!availability.available && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-xs font-medium ${
                                  availability.reason === 'blocked' ? 'text-red-600' : 'text-gray-400'
                                }`}>
                                  {availability.reason === 'blocked' ? 'Blocked' : 'Unavailable'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  
                  {/* Render appointments with precise positioning */}
                  {(() => {
                    // Collect ALL appointments for the week, properly filtered by business hours
                    const allWeekAppointments: Array<{appointment: Appointment, dayIndex: number}> = [];
                    
                    weekDates.forEach((day, dayIndex) => {
                      const dayAppointments = getAppointmentsForDay(dayIndex);
                      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
                      
                      console.log(`[DEBUG] ${dayName} (dayIndex=${dayIndex}) appointments:`, {
                        targetDate: day.date.toDateString(),
                        dayAppointments: dayAppointments.length,
                        appointmentIds: dayAppointments.map(apt => apt.id)
                      });
                      
                      dayAppointments.forEach(appointment => {
                        // Verify appointment actually belongs to this day
                        const appointmentDayOfWeek = new Date(appointment.startTime).getDay();
                        
                        if (appointmentDayOfWeek === dayIndex) {
                          // Final business hours validation
                          if (isAppointmentInBusinessHours(appointment)) {
                            allWeekAppointments.push({ appointment, dayIndex });
                          } else {
                            console.warn('[BLOCKED] Appointment outside business hours:', {
                              appointmentId: appointment.id,
                              clientName: appointment.client?.name,
                              dayName,
                              startTime: appointment.startTime
                            });
                          }
                        } else {
                          console.error('[CRITICAL ERROR] Day mismatch detected and blocked:', {
                            appointmentId: appointment.id,
                            clientName: appointment.client?.name,
                            appointmentDayOfWeek,
                            expectedDayIndex: dayIndex,
                            appointmentDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][appointmentDayOfWeek],
                            expectedDay: dayName
                          });
                        }
                      });
                    });
                    
                    console.log('[FINAL RENDER] Total appointments to render:', allWeekAppointments.length);
                    
                    // Now render each appointment in its correct column
                    return allWeekAppointments.map(({ appointment, dayIndex }) => {
                      const dayAppointments = getAppointmentsForDay(dayIndex);
                      const style = calculateAppointmentStyle(appointment.startTime, appointment.endTime, 60);
                      const colorClass = getAppointmentColor(appointment);
                      
                      const overlapping = getOverlappingAppointments(appointment, dayAppointments);
                      const overlapIndex = dayAppointments
                        .filter(apt => new Date(apt.startTime) <= new Date(appointment.startTime))
                        .indexOf(appointment);
                      
                      const isFocused = focusedAppointmentId === appointment.id;
                      const baseZIndex = 10;
                      const focusedZIndex = 40;
                      
                      // Calculate position with fixed time column (120px) + 7 day columns
                      const dayColumnWidth = `calc((100% - 120px) / 7)`;
                      
                      // ⚠️  CRITICAL BUSINESS RULE: Appointments must NEVER be positioned outside their correct day column
                      // This ensures business hours restrictions are visually enforced in the UI
                      // 
                      // 🚨 BUG HISTORY: August 13, 2025 - Overlap calculations shifted appointments to wrong day columns,
                      //    causing Thursday/Friday appointments to appear on Saturday (closed day).
                      //    See CRITICAL_BUG_REPORT_2025_08_13.md for full details.
                      //
                      // ✅ SAFE PATTERN: Always use appointment's actual day for positioning
                      const actualDayIndex = new Date(appointment.startTime).getDay();
                      
                      // ✅ SAFE: Simple positioning keeps appointments in their correct day column
                      // ❌ FORBIDDEN: Adding dayColumnWidth as offsets (shifts between day columns)
                      const dayColumnStart = `calc(120px + ${actualDayIndex} * ${dayColumnWidth})`;
                      const leftPositionValue = `calc(${dayColumnStart} + 2px)`;
                      const widthValue = `calc(${dayColumnWidth} - 8px)`;
                      
                      // ALERT: If any appointment is positioned in Saturday (index 6), it's a critical error
                      if (actualDayIndex === 6) {
                        console.error(`[CRITICAL BUG] APPOINTMENT INCORRECTLY POSITIONED IN SATURDAY COLUMN!`, {
                          appointmentId: appointment.id,
                          clientName: appointment.client?.name,
                          startTime: appointment.startTime,
                          actualDayIndex,
                          leftCSS: leftPositionValue,
                          ALERT: 'THIS SHOULD NEVER HAPPEN - SATURDAY IS CLOSED'
                        });
                      }
                      
                      console.log(`[POSITION DEBUG] Positioning appointment:`, {
                        appointmentId: appointment.id,
                        clientName: appointment.client?.name,
                        actualDayIndex,
                        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][actualDayIndex],
                        leftCSS: leftPositionValue
                      });
                      
                      return (
                        <div 
                          key={appointment.id}
                          className={`${colorClass} rounded-lg border shadow-sm cursor-pointer hover:shadow-lg transition-all ${
                            isFocused ? 'ring-2 ring-blue-400 shadow-lg' : ''
                          }`}
                          style={{
                            ...style,
                            left: leftPositionValue,
                            width: widthValue,
                            zIndex: isFocused ? focusedZIndex : baseZIndex + overlapIndex,
                            overflow: 'hidden',
                            padding: isMobile ? '6px 8px' : '4px 6px',
                            boxSizing: 'border-box'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedAppointmentId(
                              focusedAppointmentId === appointment.id ? null : appointment.id
                            );
                          }}
                        >
                          <div className="h-full flex flex-col">
                            <div className="flex-1 min-w-0">
                              <div 
                                className={`font-semibold leading-tight truncate ${
                                  isMobile ? 'text-sm' : 'text-xs'
                                }`}
                                title={`${appointment.client.name}: ${appointment.service?.name || appointment.title}`}
                              >
                                {appointment.client.name}
                              </div>
                              <div 
                                className={`leading-tight truncate text-gray-700 ${
                                  isMobile ? 'text-xs' : 'text-xs'
                                }`}
                                title={appointment.service?.name || appointment.title}
                              >
                                {appointment.service?.name || appointment.title}
                              </div>
                            </div>
                            
                            <div 
                              className={`leading-tight truncate mt-1 ${
                                isMobile ? 'text-xs' : 'text-xs'
                              }`}
                              title={formatAppointmentTime(appointment.startTime, appointment.endTime)}
                            >
                              {formatAppointmentTime(appointment.startTime, appointment.endTime)}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {viewType === 'day' && (
            <div className="h-full flex flex-col">
              <div className="border-b border-gray-200 bg-gray-50 p-4 text-center">
                <div className={`text-lg font-medium ${isToday(currentDate) ? 'text-blue-600' : 'text-gray-900'}`}>
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
                <div className={`text-2xl font-bold ${
                  isToday(currentDate) 
                    ? 'text-blue-600' 
                    : 'text-gray-900'
                }`}>
                  {currentDate.getDate()}
                </div>
                {isToday(currentDate) && (
                  <div className="text-sm text-blue-600">Today</div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {timeSlots.map((time, timeIndex) => (
                  <div key={timeIndex} className="flex border-b border-gray-100" style={{ minHeight: '40px' }}>
                    <div className="w-24 border-r border-gray-200 bg-gray-50 p-2 text-right">
                      <span className="text-xs text-gray-600">{time}</span>
                    </div>
                    <div className={`flex-1 p-2 relative ${
                      !isTimeSlotAvailable(currentDate, time).available ? 
                        (isTimeSlotAvailable(currentDate, time).reason === 'blocked' ? 'bg-red-50' : 'bg-gray-100/50') : ''
                    }`}>
                      {/* Show unavailable indicator */}
                      {!isTimeSlotAvailable(currentDate, time).available && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-medium ${
                            isTimeSlotAvailable(currentDate, time).reason === 'blocked' ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {isTimeSlotAvailable(currentDate, time).reason === 'blocked' ? 'Blocked' : 'Unavailable'}
                          </span>
                        </div>
                      )}
                      
                      {/* Render appointments for the current day */}
                      {appointments
                        .filter(appointment => {
                          // Filter appointments for current day and validate business hours
                          const appointmentDate = new Date(appointment.startTime);
                          const isSameDay = appointmentDate.getDate() === currentDate.getDate() && 
                                          appointmentDate.getMonth() === currentDate.getMonth() &&
                                          appointmentDate.getFullYear() === currentDate.getFullYear();
                          
                          // Check if appointment is within business hours
                          const isValidBusinessHours = isAppointmentInBusinessHours(appointment);
                          
                          if (isSameDay && !isValidBusinessHours) {
                            console.warn('[DAY VIEW] Blocking appointment outside business hours:', {
                              appointmentId: appointment.id,
                              clientName: appointment.client?.name,
                              startTime: appointment.startTime
                            });
                          }
                          
                          return isSameDay && isValidBusinessHours;
                        })
                        .filter(appointment => {
                          // Filter by time slot
                          const appointmentStart = new Date(appointment.startTime);
                          const appointmentHour = appointmentStart.getHours();
                          const appointmentMinute = appointmentStart.getMinutes();
                          
                          // Convert time slot to hour for comparison
                          const timeMatch = time.match(/^(\d{1,2})\s*(AM|PM)$/i);
                          if (!timeMatch) return false;
                          
                          let timeHour = parseInt(timeMatch[1]);
                          const isPM = timeMatch[2].toLowerCase() === 'pm';
                          
                          if (isPM && timeHour !== 12) {
                            timeHour += 12;
                          } else if (!isPM && timeHour === 12) {
                            timeHour = 0;
                          }
                          
                          // Check if appointment starts within this hour
                          return appointmentHour === timeHour;
                        })
                        .map(appointment => {
                          const colorClass = getAppointmentColor(appointment);
                          return (
                            <div 
                              key={appointment.id}
                              className={`${colorClass} p-3 rounded-lg text-sm relative z-10 border w-full`}
                              style={{ minHeight: '100px' }}
                            >
                              <div className="font-medium text-gray-900 mb-1">
                                {!isAppointmentInBusinessHours(appointment) && '⚠️ '}
                                {appointment.client?.name}: {appointment.service?.name || appointment.title}
                              </div>
                              <div className="text-gray-700 mb-1">
                                {appointment.description || ''}
                              </div>
                              <div className="text-gray-600">
                                {formatAppointmentTime(appointment.startTime, appointment.endTime)}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewType === 'month' && (
            <div className="h-full flex flex-col">
              <div className="grid grid-cols-7 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="border-r border-gray-200 bg-gray-50 p-3 text-center">
                    <div className="text-sm font-medium text-gray-900">{day}</div>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-7 h-full">
                  {getMonthDates(currentDate).map((dateInfo, index) => (
                    <div 
                      key={index} 
                      className={`border-r border-b border-gray-200 p-2 ${
                        dateInfo && dateInfo.isToday ? 'bg-blue-50' : ''
                      } ${!dateInfo ? 'bg-gray-50' : ''}`}
                      style={{ minHeight: '100px' }}
                    >
                      {dateInfo && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${
                            dateInfo.isToday 
                              ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' 
                              : 'text-gray-900'
                          }`}>
                            {dateInfo.day}
                          </div>
                          <div className="space-y-1">
                            {/* Count appointments for this day */}
                            {(() => {
                              const dayAppointments = appointments.filter(appointment => {
                                const appointmentDate = new Date(appointment.startTime);
                                const isValidBusinessHours = isAppointmentInBusinessHours(appointment);
                                return appointmentDate.getDate() === dateInfo.day &&
                                       appointmentDate.getMonth() === currentDate.getMonth() &&
                                       isValidBusinessHours;
                              });
                              
                              return dayAppointments.length > 0 && (
                                <div className="text-xs text-gray-600 bg-gray-100 rounded px-1 py-0.5">
                                  {dayAppointments.length} appointment{dayAppointments.length > 1 ? 's' : ''}
                                </div>
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Appointment Panel */}
      <NewAppointmentPanel 
        isOpen={isAppointmentPanelOpen}
        onClose={() => setIsAppointmentPanelOpen(false)}
      />

      {/* Block Off Time Panel */}
      <BlockOffTimePanel 
        isOpen={isBlockOffTimePanelOpen}
        onClose={() => setIsBlockOffTimePanelOpen(false)}
        onSuccess={() => {
          // Refresh blocked times and appointments after successful creation
          fetchBlockedTimes();
          handleAppointmentChange();
        }}
      />
    </DashboardLayout>
  );
};

export default CalendarPage;