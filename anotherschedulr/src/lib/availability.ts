import { format, addDays, isWithinInterval, setHours, setMinutes } from 'date-fns';

export interface BusinessHours {
  [key: string]: {
    open: boolean;
    start?: string;
    end?: string;
  };
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface BlockedTime {
  id: string;
  startTime: Date;
  endTime: Date;
  reason?: string;
  isRecurring: boolean;
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceEnd?: Date;
}

/**
 * Get the day key (sunday, monday, etc.) for a given date
 */
export const getDayKey = (date: Date): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

/**
 * Check if a specific date and time falls within business hours
 */
export const isWithinBusinessHours = (
  date: Date,
  businessHours: BusinessHours
): boolean => {
  const dayKey = getDayKey(date);
  const dayHours = businessHours[dayKey];
  
  if (!dayHours?.open || !dayHours.start || !dayHours.end) {
    return false;
  }
  
  const [startHour, startMinute] = dayHours.start.split(':').map(Number);
  const [endHour, endMinute] = dayHours.end.split(':').map(Number);
  
  const startTime = setMinutes(setHours(date, startHour), startMinute);
  const endTime = setMinutes(setHours(date, endHour), endMinute);
  
  return isWithinInterval(date, { start: startTime, end: endTime });
};

/**
 * Check if a specific date and time is blocked
 */
export const isTimeBlocked = (
  date: Date,
  blockedTimes: BlockedTime[]
): boolean => {
  return blockedTimes.some(blocked => {
    const blockStart = new Date(blocked.startTime);
    const blockEnd = new Date(blocked.endTime);
    
    // Check if the date falls within the blocked time period
    if (isWithinInterval(date, { start: blockStart, end: blockEnd })) {
      return true;
    }
    
    // Handle recurring blocks
    if (blocked.isRecurring && blocked.recurrenceType && blocked.recurrenceEnd) {
      const recurrenceEnd = new Date(blocked.recurrenceEnd);
      
      // Don't check beyond recurrence end date
      if (date > recurrenceEnd) {
        return false;
      }
      
      // Calculate if this date matches the recurrence pattern
      switch (blocked.recurrenceType) {
        case 'DAILY': {
          // Check if the time of day matches
          const blockTimeStart = blockStart.getHours() * 60 + blockStart.getMinutes();
          const blockTimeEnd = blockEnd.getHours() * 60 + blockEnd.getMinutes();
          const dateTime = date.getHours() * 60 + date.getMinutes();
          
          return dateTime >= blockTimeStart && dateTime <= blockTimeEnd;
        }
        
        case 'WEEKLY': {
          // Check if it's the same day of week and time
          if (date.getDay() === blockStart.getDay()) {
            const blockTimeStart = blockStart.getHours() * 60 + blockStart.getMinutes();
            const blockTimeEnd = blockEnd.getHours() * 60 + blockEnd.getMinutes();
            const dateTime = date.getHours() * 60 + date.getMinutes();
            
            return dateTime >= blockTimeStart && dateTime <= blockTimeEnd;
          }
          break;
        }
        
        case 'MONTHLY': {
          // Check if it's the same day of month and time
          if (date.getDate() === blockStart.getDate()) {
            const blockTimeStart = blockStart.getHours() * 60 + blockStart.getMinutes();
            const blockTimeEnd = blockEnd.getHours() * 60 + blockEnd.getMinutes();
            const dateTime = date.getHours() * 60 + date.getMinutes();
            
            return dateTime >= blockTimeStart && dateTime <= blockTimeEnd;
          }
          break;
        }
      }
    }
    
    return false;
  });
};

/**
 * Generate available time slots for a specific date based on business hours
 */
export const generateTimeSlots = (
  date: Date,
  businessHours: BusinessHours,
  slotDuration: number = 30, // minutes
  appointments: Array<{ start: Date; end: Date }> = []
): TimeSlot[] => {
  const dayKey = getDayKey(date);
  const dayHours = businessHours[dayKey];
  
  if (!dayHours?.open || !dayHours.start || !dayHours.end) {
    return [];
  }
  
  const [startHour, startMinute] = dayHours.start.split(':').map(Number);
  const [endHour, endMinute] = dayHours.end.split(':').map(Number);
  
  const startTime = setMinutes(setHours(date, startHour), startMinute);
  const endTime = setMinutes(setHours(date, endHour), endMinute);
  
  const slots: TimeSlot[] = [];
  let currentTime = new Date(startTime);
  
  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
    
    if (slotEnd <= endTime) {
      // Check if this slot conflicts with any existing appointments
      const isAvailable = !appointments.some(appointment => 
        isWithinInterval(currentTime, { start: appointment.start, end: appointment.end }) ||
        isWithinInterval(slotEnd, { start: appointment.start, end: appointment.end }) ||
        (currentTime <= appointment.start && slotEnd >= appointment.end)
      );
      
      slots.push({
        start: new Date(currentTime),
        end: new Date(slotEnd),
        available: isAvailable
      });
    }
    
    currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
  }
  
  return slots;
};

/**
 * Get business hours for a specific week
 */
export const getWeekBusinessHours = (
  weekStartDate: Date,
  businessHours: BusinessHours
): Array<{ date: Date; dayKey: string; hours: BusinessHours[string] }> => {
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStartDate, i);
    const dayKey = getDayKey(date);
    
    weekDays.push({
      date,
      dayKey,
      hours: businessHours[dayKey] || { open: false }
    });
  }
  
  return weekDays;
};

/**
 * Format time slot for display
 */
export const formatTimeSlot = (slot: TimeSlot): string => {
  const startTime = format(slot.start, 'h:mm a');
  const endTime = format(slot.end, 'h:mm a');
  return `${startTime} - ${endTime}`;
};

/**
 * Convert 24-hour time string to 12-hour format
 */
export const formatTime12Hour = (time24: string): string => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Convert 12-hour time string to 24-hour format
 */
export const formatTime24Hour = (time12: string): string => {
  if (!time12) return '';
  
  const match = time12.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return time12;
  
  const [, hours, minutes, ampm] = match;
  let hour = parseInt(hours, 10);
  
  if (ampm.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return `${hour.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Parse business hours from JSON string
 */
export const parseBusinessHours = (businessHoursJson: string | null): BusinessHours => {
  if (!businessHoursJson) {
    // Default business hours
    return {
      sunday: { open: false },
      monday: { open: true, start: '09:00', end: '17:00' },
      tuesday: { open: true, start: '09:00', end: '17:00' },
      wednesday: { open: true, start: '09:00', end: '17:00' },
      thursday: { open: true, start: '09:00', end: '17:00' },
      friday: { open: true, start: '09:00', end: '17:00' },
      saturday: { open: false }
    };
  }
  
  try {
    return JSON.parse(businessHoursJson);
  } catch (error) {
    console.error('Error parsing business hours:', error);
    return parseBusinessHours(null); // Return default hours
  }
};

/**
 * Validate business hours object
 */
export const validateBusinessHours = (businessHours: BusinessHours): boolean => {
  const requiredDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  for (const day of requiredDays) {
    if (!businessHours[day]) return false;
    
    const dayHours = businessHours[day];
    if (typeof dayHours.open !== 'boolean') return false;
    
    if (dayHours.open) {
      if (!dayHours.start || !dayHours.end) return false;
      
      // Validate time format (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(dayHours.start) || !timeRegex.test(dayHours.end)) return false;
      
      // Validate that start time is before end time
      const [startHour, startMinute] = dayHours.start.split(':').map(Number);
      const [endHour, endMinute] = dayHours.end.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      if (startMinutes >= endMinutes) return false;
    }
  }
  
  return true;
};