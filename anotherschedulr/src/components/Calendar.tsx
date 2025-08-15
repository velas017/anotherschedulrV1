"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailabilityData {
  date: string;
  dayName: string;
  timeSlots: TimeSlot[];
  businessHours: {
    start: string;
    end: string;
    open: boolean;
  };
}

interface BusinessHours {
  [key: string]: {
    open: boolean;
    start?: string;
    end?: string;
  };
}

interface CalendarProps {
  userId: string;
  serviceDuration: number;
  onDateTimeSelect: (date: Date, time: string) => void;
  selectedDateTime?: {date: Date | null, time: string | null};
}

const Calendar: React.FC<CalendarProps> = ({ 
  userId, 
  serviceDuration, 
  onDateTimeSelect,
  selectedDateTime 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [timezone] = useState('EASTERN TIME (GMT-04:00)');
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [isLoadingBusinessHours, setIsLoadingBusinessHours] = useState(true);

  // Get the first day of the current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Month navigation
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
    setAvailableTimeSlots([]);
  }, []);

  // Fetch available time slots for a specific date
  const fetchAvailableSlots = useCallback(async (date: Date) => {
    setIsLoadingSlots(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const response = await fetch(
        `/api/public/${userId}/availability?date=${dateString}&duration=${serviceDuration}`
      );
      
      if (response.ok) {
        const data: AvailabilityData = await response.json();
        setAvailableTimeSlots(data.timeSlots || []);
      } else {
        console.error('Failed to fetch availability');
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailableTimeSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [userId, serviceDuration]);

  // Fetch business hours for the user
  const fetchBusinessHours = useCallback(async () => {
    if (!userId) return;
    
    setIsLoadingBusinessHours(true);
    try {
      const response = await fetch(`/api/public/${userId}/business-hours`);
      
      if (response.ok) {
        const data = await response.json();
        setBusinessHours(data.businessHours || {});
      } else {
        console.error('Failed to fetch business hours');
        // Set default business hours if fetch fails
        setBusinessHours({
          sunday: { open: false },
          monday: { open: true, start: '09:00', end: '17:00' },
          tuesday: { open: true, start: '09:00', end: '17:00' },
          wednesday: { open: true, start: '09:00', end: '17:00' },
          thursday: { open: true, start: '09:00', end: '17:00' },
          friday: { open: true, start: '09:00', end: '17:00' },
          saturday: { open: false }
        });
      }
    } catch (error) {
      console.error('Error fetching business hours:', error);
      // Set default business hours on error
      setBusinessHours({
        sunday: { open: false },
        monday: { open: true, start: '09:00', end: '17:00' },
        tuesday: { open: true, start: '09:00', end: '17:00' },
        wednesday: { open: true, start: '09:00', end: '17:00' },
        thursday: { open: true, start: '09:00', end: '17:00' },
        friday: { open: true, start: '09:00', end: '17:00' },
        saturday: { open: false }
      });
    } finally {
      setIsLoadingBusinessHours(false);
    }
  }, [userId]);

  // Fetch business hours when component mounts or userId changes
  useEffect(() => {
    fetchBusinessHours();
  }, [fetchBusinessHours]);

  // Check if a date falls on a closed business day
  const isClosedDate = useCallback((day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[checkDate.getDay()];
    return !businessHours[dayName]?.open;
  }, [currentDate, businessHours]);

  // Handle date selection
  const handleDateClick = useCallback((day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Don't allow past dates or closed business days
    if (clickedDate < today || isClosedDate(day)) {
      return;
    }
    
    setSelectedDate(clickedDate);
    fetchAvailableSlots(clickedDate);
  }, [currentDate, fetchAvailableSlots, isClosedDate]);

  // Handle time slot selection
  const handleTimeSlotClick = useCallback((time: string) => {
    if (selectedDate) {
      onDateTimeSelect(selectedDate, time);
    }
  }, [selectedDate, onDateTimeSelect]);

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Check if a date is today
  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  // Check if a date is in the past
  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate < today;
  };

  // Check if a date is selected
  const isSelectedDate = (day: number) => {
    return selectedDate && 
           selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentDate.getMonth() && 
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Show loading state while fetching business hours
  if (isLoadingBusinessHours) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="ml-3 text-gray-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <div className="text-center mb-4">
          <h4 className="text-lg font-medium text-gray-900">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          <p className="text-sm text-gray-500 mt-1">TIME ZONE: {timezone}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, index) => (
              <div key={index} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div key={index} className="aspect-square">
                {day ? (
                  <button
                    onClick={() => handleDateClick(day)}
                    disabled={isPastDate(day) || isClosedDate(day)}
                    className={`
                      w-full h-full rounded-lg text-sm font-medium transition-colors
                      ${isPastDate(day) || isClosedDate(day)
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-900 hover:bg-gray-100 cursor-pointer'
                      }
                      ${isToday(day) && !isPastDate(day) && !isClosedDate(day)
                        ? 'bg-black text-white hover:bg-gray-800' 
                        : ''
                      }
                      ${isSelectedDate(day) && !isToday(day) && !isPastDate(day) && !isClosedDate(day)
                        ? 'bg-blue-100 text-blue-900 border-2 border-blue-500'
                        : ''
                      }
                    `}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-full h-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="space-y-4">
          {selectedDate ? (
            <>
              <h4 className="text-lg font-medium text-gray-900">Available Times</h4>
              
              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : availableTimeSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {availableTimeSlots
                    .filter(slot => slot.available)
                    .map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleTimeSlotClick(slot.time)}
                        className={`
                          p-3 text-center border border-gray-200 rounded-lg font-medium transition-colors cursor-pointer
                          ${selectedDateTime?.time === slot.time 
                            ? 'bg-black text-white' 
                            : 'bg-white text-gray-900 hover:bg-gray-50'
                          }
                        `}
                      >
                        {formatTime(slot.time)}
                      </button>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No available times for this date</p>
                  <p className="text-sm text-gray-400 mt-1">Please select another date</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a date to view available times</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;