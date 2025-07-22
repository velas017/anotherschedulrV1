"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboardLayout';
import NewAppointmentPanel from '@/components/newAppointmentPanel';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Clock,
  ChevronDown,
  Printer
} from 'lucide-react';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAppointmentPanelOpen, setIsAppointmentPanelOpen] = useState(false);

  // Time slots for the day view
  const timeSlots = [
    '8am', '9am', '10am', '11am', 'Noon', '1pm', '2pm', '3pm', '4pm', '5pm'
  ];

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

  const formatCurrentWeek = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const month = weekStart.toLocaleDateString('en-US', { month: 'long' });
    const day = weekStart.getDate();
    const year = weekStart.getFullYear();
    return `Week of ${month} ${day}, ${year}`;
  };

  // Go to today's date
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <DashboardLayout
      title={formatCurrentWeek()}
      subtitle={`${appointments.length} appointments${isCurrentWeek() ? ' • current week' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Calendar Controls Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
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
                    newDate.setDate(currentDate.getDate() - 7);
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
                    newDate.setDate(currentDate.getDate() + 7);
                    setCurrentDate(newDate);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded border">
                  Week View
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
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
                <div key={timeIndex} className="grid grid-cols-8 border-b border-gray-100" style={{ minHeight: '80px' }}>
                  {/* Time label */}
                  <div className="border-r border-gray-200 bg-gray-50 p-3 text-right">
                    <span className="text-sm text-gray-600">{time}</span>
                  </div>
                  
                  {/* Day columns */}
                  {weekDates.map((day, dayIndex) => (
                    <div 
                      key={dayIndex} 
                      className={`border-r border-gray-100 relative p-2 ${
                        day.isToday ? 'bg-blue-50/30' : ''
                      }`}
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
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Appointment Panel */}
      <NewAppointmentPanel 
        isOpen={isAppointmentPanelOpen}
        onClose={() => setIsAppointmentPanelOpen(false)}
      />
    </DashboardLayout>
  );
};

export default CalendarPage;