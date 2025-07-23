"use client";

import React from 'react';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TimeInput: React.FC<TimeInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select time",
  disabled = false 
}) => {
  // Convert 24-hour to 12-hour format for display
  const formatTimeForDisplay = (time24: string) => {
    if (!time24) return '';
    
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${hour12}:${minutes}${ampm}`;
  };

  // Convert 12-hour to 24-hour format for storage
  const parseTimeFromDisplay = (displayTime: string) => {
    if (!displayTime) return '';
    
    const match = displayTime.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
    if (!match) return displayTime; // Return original if doesn't match expected format
    
    const [, hours, minutes, ampm] = match;
    let hour = parseInt(hours, 10);
    
    if (ampm.toLowerCase() === 'pm' && hour !== 12) {
      hour += 12;
    } else if (ampm.toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow direct 24-hour format input (HH:MM)
    if (/^\d{2}:\d{2}$/.test(inputValue)) {
      onChange(inputValue);
      return;
    }
    
    // Try to parse 12-hour format
    const time24 = parseTimeFromDisplay(inputValue);
    if (time24) {
      onChange(time24);
    }
  };

  const displayValue = formatTimeForDisplay(value);

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  );
};

export default TimeInput;