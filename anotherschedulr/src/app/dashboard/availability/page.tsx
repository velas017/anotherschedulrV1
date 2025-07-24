"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboardLayout';
import { HelpCircle, Save } from 'lucide-react';
import WeeklyHoursGrid from '@/components/availability/WeeklyHoursGrid';

interface BusinessHours {
  [key: string]: {
    open: boolean;
    start?: string;
    end?: string;
  };
}

const AvailabilityPage = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    sunday: { open: false },
    monday: { open: true, start: '09:00', end: '17:00' },
    tuesday: { open: true, start: '09:00', end: '17:00' },
    wednesday: { open: true, start: '09:00', end: '17:00' },
    thursday: { open: true, start: '09:00', end: '17:00' },
    friday: { open: true, start: '09:00', end: '17:00' },
    saturday: { open: false }
  });
  const [hasRegularHours, setHasRegularHours] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current business hours
  useEffect(() => {
    fetchBusinessHours();
  }, []);

  const fetchBusinessHours = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/scheduling-page');
      
      if (response.ok) {
        const data = await response.json();
        if (data.businessHours) {
          const hours = typeof data.businessHours === 'string' 
            ? JSON.parse(data.businessHours) 
            : data.businessHours as BusinessHours;
          setBusinessHours(hours);
          
          // Check if user has regular hours (at least one day is open)
          const hasOpenDays = Object.values(hours).some((day) => day.open);
          setHasRegularHours(hasOpenDays);
        }
      }
    } catch (error) {
      console.error('Error fetching business hours:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/scheduling-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessHours: JSON.stringify(businessHours)
        })
      });

      if (response.ok) {
        // Could add a success toast here
        console.log('Business hours saved successfully');
      } else {
        throw new Error('Failed to save business hours');
      }
    } catch (error) {
      console.error('Error saving business hours:', error);
      // Could add an error toast here
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegularHoursToggle = (checked: boolean) => {
    setHasRegularHours(checked);
    if (!checked) {
      // Close all days when turning off regular hours
      const closedHours = Object.keys(businessHours).reduce((acc, day) => {
        acc[day] = { open: false };
        return acc;
      }, {} as BusinessHours);
      setBusinessHours(closedHours);
    }
  };

  const handleHoursChange = (updatedHours: BusinessHours) => {
    setBusinessHours(updatedHours);
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Set Hours of Availability"
        subtitle="Choose the hours you accept bookings from clients"
        rightContent={
          <HelpCircle className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading availability settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Set Hours of Availability"
      subtitle="Choose the hours you accept bookings from clients"
      rightContent={
        <HelpCircle className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
      }
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Regular Hours Toggle */}
            <fieldset className="mb-6">
              <legend className="sr-only">Business hours configuration</legend>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="regular-hours-toggle"
                  checked={hasRegularHours}
                  onChange={(e) => handleRegularHoursToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                  aria-describedby="regular-hours-description"
                />
                <div>
                  <label htmlFor="regular-hours-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                    I have regular hours every week
                  </label>
                  <p id="regular-hours-description" className="text-xs text-gray-600 mt-1">
                    Enable this to set consistent business hours that repeat each week
                  </p>
                </div>
              </div>
            </fieldset>

            {/* Weekly Hours Grid */}
            {hasRegularHours && (
              <fieldset className="mb-6">
                <legend className="text-base font-medium text-gray-900 mb-4">
                  Set your weekly business hours
                </legend>
                <div aria-describedby="hours-grid-description">
                  <WeeklyHoursGrid
                    businessHours={businessHours}
                    onChange={handleHoursChange}
                  />
                </div>
                <p id="hours-grid-description" className="text-sm text-gray-600 mt-3">
                  Configure the hours you&apos;re available for appointments each day of the week
                </p>
              </fieldset>
            )}

            {/* Save Button */}
            <div className="flex justify-start">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-describedby={isSaving ? "save-status" : undefined}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" aria-hidden="true" />
                    <span>SAVE REGULAR HOURS</span>
                  </>
                )}
              </button>
              {isSaving && (
                <div id="save-status" className="sr-only" aria-live="polite">
                  Saving your business hours, please wait...
                </div>
              )}
            </div>

            {/* Help Text */}
            {hasRegularHours && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg" role="complementary">
                <h3 className="text-sm font-medium text-gray-900 mb-2">How this works</h3>
                <p className="text-sm text-gray-700">
                  Clients will see available time slots during your business hours when booking appointments. 
                  These hours work together with your other scheduling settings to determine availability.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AvailabilityPage;