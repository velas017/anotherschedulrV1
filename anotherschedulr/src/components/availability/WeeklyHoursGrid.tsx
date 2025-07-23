"use client";

import React from 'react';
import TimeInput from './TimeInput';

interface BusinessHours {
  [key: string]: {
    open: boolean;
    start?: string;
    end?: string;
  };
}

interface WeeklyHoursGridProps {
  businessHours: BusinessHours;
  onChange: (hours: BusinessHours) => void;
}

const DAYS = [
  { key: 'sunday', label: 'SUNDAY' },
  { key: 'monday', label: 'MONDAY' },
  { key: 'tuesday', label: 'TUESDAY' },
  { key: 'wednesday', label: 'WEDNESDAY' },
  { key: 'thursday', label: 'THURSDAY' },
  { key: 'friday', label: 'FRIDAY' },
  { key: 'saturday', label: 'SATURDAY' }
];

const WeeklyHoursGrid: React.FC<WeeklyHoursGridProps> = ({ businessHours, onChange }) => {
  const handleDayToggle = (dayKey: string, isOpen: boolean) => {
    const updatedHours = {
      ...businessHours,
      [dayKey]: isOpen 
        ? { 
            open: true, 
            start: businessHours[dayKey]?.start || '09:00', 
            end: businessHours[dayKey]?.end || '17:00' 
          }
        : { open: false }
    };
    onChange(updatedHours);
  };

  const handleTimeChange = (dayKey: string, timeType: 'start' | 'end', value: string) => {
    const updatedHours = {
      ...businessHours,
      [dayKey]: {
        ...businessHours[dayKey],
        [timeType]: value
      }
    };
    onChange(updatedHours);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {DAYS.map((day) => (
          <div key={day.key} className="p-3 text-center">
            <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              {day.label}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-7">
        {DAYS.map((day) => {
          const dayHours = businessHours[day.key];
          const isOpen = dayHours?.open || false;

          return (
            <div key={day.key} className="border-r border-gray-200 last:border-r-0 p-4 min-h-[120px] bg-white hover:bg-gray-50 transition-colors">
              {isOpen ? (
                <div className="space-y-3">
                  {/* Start Time */}
                  <div>
                    <TimeInput
                      value={dayHours.start || '09:00'}
                      onChange={(value) => handleTimeChange(day.key, 'start', value)}
                      placeholder="Start time"
                    />
                  </div>
                  
                  {/* Separator */}
                  <div className="text-center text-gray-400 text-sm">to</div>
                  
                  {/* End Time */}
                  <div>
                    <TimeInput
                      value={dayHours.end || '17:00'}
                      onChange={(value) => handleTimeChange(day.key, 'end', value)}
                      placeholder="End time"
                    />
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => handleDayToggle(day.key, false)}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
                  >
                    Close this day
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="text-sm mb-2">Closed</div>
                  <button
                    onClick={() => handleDayToggle(day.key, true)}
                    className="text-xs text-blue-600 hover:text-blue-700 underline transition-colors"
                  >
                    Add hours
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyHoursGrid;