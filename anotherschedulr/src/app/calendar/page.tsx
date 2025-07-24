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
import { parseBusinessHours, isWithinBusinessHours } from '@/lib/availability';
import type { BusinessHours } from '@/lib/availability';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month' | 'day'>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAppointmentPanelOpen, setIsAppointmentPanelOpen] = useState(false);
  const [isBlockOffTimePanelOpen, setIsBlockOffTimePanelOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [isLoadingBusinessHours, setIsLoadingBusinessHours] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch business hours on component mount
  useEffect(() => {
    fetchBusinessHours();
  }, []);

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
      setIsLoadingBusinessHours(true);
      const response = await fetch('/api/scheduling-page');
      
      if (response.ok) {
        const data = await response.json();
        const hours = parseBusinessHours(data.businessHours);
        setBusinessHours(hours);
      } else {
        // Use default business hours if API fails
        setBusinessHours(parseBusinessHours(null));
      }
    } catch (error) {
      console.error('Error fetching business hours:', error);
      setBusinessHours(parseBusinessHours(null));
    } finally {
      setIsLoadingBusinessHours(false);
    }
  };

  // Generate time slots based on business hours or use default
  const generateTimeSlotsForView = () => {
    // If still loading business hours, show default slots
    if (isLoadingBusinessHours || Object.keys(businessHours).length === 0) {
      return ['8am', '8:30am', '9am', '9:30am', '10am', '10:30am', '11am', '11:30am', 'Noon', '12:30pm', '1pm', '1:30pm', '2pm', '2:30pm', '3pm', '3:30pm', '4pm', '4:30pm', '5pm'];
    }

    // Generate time slots from 8am to 8pm in 30-minute intervals
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        let displayTime;
        if (hour === 12 && minute === 0) {
          displayTime = 'Noon';
        } else if (hour === 12 && minute === 30) {
          displayTime = '12:30pm';
        } else if (hour > 12) {
          displayTime = minute === 0 ? `${hour - 12}pm` : `${hour - 12}:30pm`;
        } else {
          displayTime = minute === 0 ? `${hour}am` : `${hour}:30am`;
        }
        slots.push(displayTime);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlotsForView();

  // Check if a time slot should be disabled based on business hours
  const isTimeSlotAvailable = (date: Date, timeSlot: string) => {
    if (isLoadingBusinessHours || Object.keys(businessHours).length === 0) {
      return true; // Show all slots while loading
    }

    // Convert time slot string to hour and minute
    let hour = 0;
    let minute = 0;
    
    if (timeSlot === 'Noon') {
      hour = 12;
      minute = 0;
    } else {
      // Parse time slots like "11:30am" or "2pm"
      const timeMatch = timeSlot.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
      if (timeMatch) {
        hour = parseInt(timeMatch[1]);
        minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const isPM = timeMatch[3].toLowerCase() === 'pm';
        
        if (isPM && hour !== 12) {
          hour += 12;
        } else if (!isPM && hour === 12) {
          hour = 0;
        }
      }
    }

    // Create a date object for this time slot
    const slotDate = new Date(date);
    slotDate.setHours(hour, minute, 0, 0);

    return isWithinBusinessHours(slotDate, businessHours);
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

  // Sample appointments data (updated to use dynamic dates)
  const appointments = [
    {
      id: 1,
      client: 'Edna Matias',
      service: '60 Minute Custom Facial',
      treatment: 'LED Blue Light Therapy (Acne)',
      time: '10:30AM-11:45AM',
      dayIndex: 4, // Thursday (0 = Sunday)
      color: 'bg-purple-200 border-purple-300'
    }
  ];

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

  // Go to today's date
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <DashboardLayout
      title={formatCurrentPeriod()}
      subtitle={`${appointments.length} appointments${viewType === 'week' && isCurrentWeek() ? ' • current week' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Calendar Controls Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsBlockOffTimePanelOpen(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Clock className="mr-2 h-4 w-4" />
                BLOCK OFF TIME
              </button>
              
              <button 
                onClick={() => setIsAppointmentPanelOpen(true)}
                className="flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800"
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
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                
                <button 
                  onClick={goToToday}
                  className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
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
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <div ref={dropdownRef} className="relative">
                  <button 
                    onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                    className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded border"
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
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Day View
                      </button>
                      <button
                        onClick={() => {
                          setViewType('week');
                          setIsViewDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Week View
                      </button>
                      <button
                        onClick={() => {
                          setViewType('month');
                          setIsViewDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Month View
                      </button>
                    </div>
                  )}
                </div>
                
                <button className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded border">
                  All calendars
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
                <button className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded border">
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
              
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white overflow-hidden">
          {viewType === 'week' && (
            <div className="h-full flex flex-col">
              <div className="grid grid-cols-8 border-b border-gray-200">
                {/* Empty cell for time column */}
                <div className="border-r border-gray-200 bg-gray-50 p-3"></div>
                
                {/* Day headers */}
                {weekDates.map((day, index) => (
                  <div 
                    key={index} 
                    className={`border-r border-gray-200 p-3 text-center ${
                      day.isToday ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`text-sm font-medium ${
                      day.isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {day.dayNameShort}
                    </div>
                    <div className={`text-sm ${
                      day.isToday 
                        ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' 
                        : 'text-gray-500'
                    }`}>
                      {day.dayNumber}
                    </div>
                    {day.isToday && (
                      <div className="text-xs text-blue-600 mt-1">Today</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Time slots and appointment grid */}
              <div className="flex-1 overflow-y-auto">
                {timeSlots.map((time, timeIndex) => (
                  <div key={timeIndex} className="grid grid-cols-8 border-b border-gray-100" style={{ minHeight: '40px' }}>
                    {/* Time label */}
                    <div className="border-r border-gray-200 bg-gray-50 p-2 text-right">
                      <span className="text-xs text-gray-600">{time}</span>
                    </div>
                    
                    {/* Day columns */}
                    {weekDates.map((day, dayIndex) => {
                      const isAvailable = isTimeSlotAvailable(day.date, time);
                      return (
                        <div 
                          key={dayIndex} 
                          className={`border-r border-gray-100 relative p-2 ${
                            day.isToday ? 'bg-blue-50/30' : ''
                          } ${!isAvailable ? 'bg-gray-100/50' : ''}`}
                        >
                          {/* Render appointment if it matches this day and time */}
                          {appointments.map((appointment) => (
                            appointment.dayIndex === dayIndex && appointment.time.includes(time.replace('am', 'AM').replace('pm', 'PM')) && (
                              <div 
                                key={appointment.id}
                                className={`${appointment.color} p-3 rounded-lg text-xs relative z-10 border`}
                                style={{ minHeight: '120px' }}
                              >
                                <div className="font-medium text-gray-900 mb-1">
                                  {appointment.client}: {appointment.service}
                                </div>
                                <div className="text-gray-700 mb-1">
                                  {appointment.treatment}
                                </div>
                                <div className="text-gray-600">
                                  {appointment.time}
                                </div>
                              </div>
                            )
                          ))}
                          
                          {/* Show unavailable indicator for business hours */}
                          {!isAvailable && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs text-gray-400 font-medium">Unavailable</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
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
                      !isTimeSlotAvailable(currentDate, time) ? 'bg-gray-100/50' : ''
                    }`}>
                      {/* Show unavailable indicator for business hours */}
                      {!isTimeSlotAvailable(currentDate, time) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-gray-400 font-medium">Unavailable</span>
                        </div>
                      )}
                      
                      {/* Render appointments for the current day */}
                      {appointments.map((appointment) => {
                        const appointmentDate = new Date(currentDate);
                        appointmentDate.setDate(currentDate.getDate() - currentDate.getDay() + appointment.dayIndex);
                        const isSameDay = appointmentDate.getDate() === currentDate.getDate() && 
                                        appointmentDate.getMonth() === currentDate.getMonth() &&
                                        appointmentDate.getFullYear() === currentDate.getFullYear();
                        
                        return isSameDay && appointment.time.includes(time.replace('am', 'AM').replace('pm', 'PM')) && (
                          <div 
                            key={appointment.id}
                            className={`${appointment.color} p-3 rounded-lg text-sm relative z-10 border w-full`}
                            style={{ minHeight: '100px' }}
                          >
                            <div className="font-medium text-gray-900 mb-1">
                              {appointment.client}: {appointment.service}
                            </div>
                            <div className="text-gray-700 mb-1">
                              {appointment.treatment}
                            </div>
                            <div className="text-gray-600">
                              {appointment.time}
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
                                const appointmentDate = new Date(currentDate);
                                appointmentDate.setDate(currentDate.getDate() - currentDate.getDay() + appointment.dayIndex);
                                return appointmentDate.getDate() === dateInfo.day &&
                                       appointmentDate.getMonth() === currentDate.getMonth();
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
      />
    </DashboardLayout>
  );
};

export default CalendarPage;