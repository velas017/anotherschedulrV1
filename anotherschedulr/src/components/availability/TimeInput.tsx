"use client";

import React, { useState, useEffect } from 'react';

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

  // Local state for the input display value
  const [displayValue, setDisplayValue] = useState(() => formatTimeForDisplay(value));

  // Sync display value when prop value changes
  useEffect(() => {
    setDisplayValue(formatTimeForDisplay(value));
  }, [value]);

  // Convert 12-hour to 24-hour format for storage
  const parseTimeFromDisplay = (displayTime: string) => {
    if (!displayTime) return '';
    
    // Check for 24-hour format (HH:MM)
    const match24 = displayTime.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const [, hours, minutes] = match24;
      const hour = parseInt(hours, 10);
      if (hour >= 0 && hour <= 23) {
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      }
    }
    
    // Check for 12-hour format
    const match12 = displayTime.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match12) {
      const [, hours, minutes, ampm] = match12;
      let hour = parseInt(hours, 10);
      
      if (ampm.toLowerCase() === 'pm' && hour !== 12) {
        hour += 12;
      } else if (ampm.toLowerCase() === 'am' && hour === 12) {
        hour = 0;
      }
      
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Always update the display value so user can see what they're typing
    setDisplayValue(e.target.value);
  };

  const handleBlur = () => {
    // Try to parse the input when user finishes typing
    const parsed = parseTimeFromDisplay(displayValue);
    if (parsed) {
      onChange(parsed);
      setDisplayValue(formatTimeForDisplay(parsed));
    } else {
      // If invalid, revert to the previous valid value
      setDisplayValue(formatTimeForDisplay(value));
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-3 pr-10 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label={`Time input: ${placeholder}`}
        aria-describedby={disabled ? undefined : `${placeholder.toLowerCase().replace(/\s+/g, '-')}-help`}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg 
          className="w-4 h-4 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      {!disabled && (
        <div id={`${placeholder.toLowerCase().replace(/\s+/g, '-')}-help`} className="sr-only">
          Enter time in format like 9:00am or 17:00
        </div>
      )}
    </div>
  );
};

export default TimeInput;