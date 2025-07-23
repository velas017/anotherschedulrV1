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