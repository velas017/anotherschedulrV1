// Calendar utility functions

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  return start1Min < end2Min && start2Min < end1Min;
}

/**
 * Format date for API queries
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString();
}

/**
 * Get the start and end of a week
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get hours and minutes from a Date object
 */
export function getTimeFromDate(date: Date): { hours: number; minutes: number } {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes()
  };
}

/**
 * Create a Date object for a specific time on a given date
 */
export function createDateWithTime(date: Date, hours: number, minutes: number = 0): Date {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * Calculate appointment duration in minutes
 */
export function getAppointmentDuration(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end.getTime() - start.getTime()) / (1000 * 60);
}

/**
 * Check if an appointment is happening today
 */
export function isAppointmentToday(appointmentDate: string): boolean {
  const appointment = new Date(appointmentDate);
  const today = new Date();
  
  return appointment.getDate() === today.getDate() &&
         appointment.getMonth() === today.getMonth() &&
         appointment.getFullYear() === today.getFullYear();
}

/**
 * Get appointment status color class
 */
export function getStatusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
      return 'bg-green-100 border-green-300 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 border-red-300 text-red-800';
    case 'COMPLETED':
      return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'NO_SHOW':
      return 'bg-gray-100 border-gray-300 text-gray-800';
    default: // SCHEDULED
      return 'bg-orange-100 border-orange-300 text-orange-800';
  }
}

/**
 * Generate time slots for a day
 */
export function generateDayTimeSlots(startHour: number = 8, endHour: number = 22, intervalMinutes: number = 60): string[] {
  const slots = [];
  
  for (let hour = startHour; hour <= endHour; hour++) {
    if (hour === 12) {
      slots.push('12 PM');
    } else if (hour > 12) {
      slots.push(`${hour - 12} PM`);
    } else {
      slots.push(`${hour} AM`);
    }
  }
  
  return slots;
}

/**
 * Check if a time slot is within business hours
 */
export function isTimeSlotInBusinessHours(
  date: Date, 
  timeSlot: string, 
  businessHours: any
): boolean {
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  const dayHours = businessHours[dayName];
  
  if (!dayHours?.open) return false;
  
  // Parse the time slot to get the hour
  const timeMatch = timeSlot.match(/(\d{1,2})\s*(AM|PM)/);
  if (!timeMatch) return false;
  
  let hour = parseInt(timeMatch[1]);
  const isPM = timeMatch[2] === 'PM';
  
  if (isPM && hour !== 12) hour += 12;
  else if (!isPM && hour === 12) hour = 0;
  
  // Parse business hours
  const [startHour] = dayHours.start.split(':').map(Number);
  const [endHour] = dayHours.end.split(':').map(Number);
  
  return hour >= startHour && hour < endHour;
}