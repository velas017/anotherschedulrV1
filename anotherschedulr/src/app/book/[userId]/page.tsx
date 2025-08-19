"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Calendar from '@/components/Calendar';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isVisible: boolean;
  sortOrder: number;
  category?: {
    id: string;
    name: string;
  };
}

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
  services: Service[];
}

interface SchedulingPageConfig {
  welcomeMessage?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  allowOnlineBooking: boolean;
}

const PublicBookingPage = () => {
  const params = useParams();
  const userId = params.userId as string;
  
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [currentView, setCurrentView] = useState<'categories' | 'services' | 'calendar' | 'customerInfo'>('categories');
  const [selectedCategoryData, setSelectedCategoryData] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<{date: Date | null, time: string | null}>({date: null, time: null});
  
  // Customer form state
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [config, setConfig] = useState<SchedulingPageConfig>({
    primaryColor: '#000000',
    secondaryColor: '#6b7280',
    fontFamily: 'Inter',
    allowOnlineBooking: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories and services for this user
        const response = await fetch(`/api/public/${userId}/services`);
        
        if (!response.ok) {
          throw new Error('Failed to load booking page');
        }
        
        const data = await response.json();
        
        // API Response received successfully
        
        setCategories(data.categories || []);
        setConfig(data.config || config);
      } catch (error) {
        console.error('Error fetching booking data:', error);
        setError('Unable to load booking page');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const getVisibleCategories = () => {
    return categories.filter(category => 
      category.isVisible && category.services.some(service => service.isVisible)
    );
  };

  // Service formatting utilities
  const formatServiceDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours} hour ${mins} minutes`;
    } else if (hours > 0) {
      return `${hours} hour`;
    } else {
      return `${mins} minutes`;
    }
  };

  const formatServicePrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatServiceSummary = (duration: number, price: number) => {
    return `${formatServiceDuration(duration)} @ ${formatServicePrice(price)}`;
  };

  // Navigation handlers
  const handleCategorySelect = useCallback((category: ServiceCategory) => {
    if (!category || !category.services || category.services.length === 0) {
      console.warn('Category has no services:', category);
      return;
    }
    
    // Set both state values in a single update to prevent race conditions
    setSelectedCategoryData(category);
    setCurrentView('services');
  }, []);

  const handleBackToCategories = () => {
    setSelectedCategoryData(null);
    setCurrentView('categories');
  };

  const handleServiceSelect = useCallback((service: Service) => {
    setSelectedService(service);
    setCurrentView('calendar');
  }, []);

  const handleBackToServices = useCallback(() => {
    setSelectedService(null);
    setSelectedDateTime({date: null, time: null});
    setCurrentView('services');
  }, []);

  const handleDateTimeSelect = useCallback((date: Date, time: string) => {
    setSelectedDateTime({date, time});
    setCurrentView('customerInfo');
  }, []);

  const handleBackToCalendar = useCallback(() => {
    setCurrentView('calendar');
  }, []);

  const handleShowAllAppointments = () => {
    // In a real implementation, this would show all available time slots
    console.log('Show all appointments');
  };

  // Format date and time for display
  const formatAppointmentDateTime = (date: Date | null, time: string | null) => {
    if (!date || !time) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const dateStr = date.toLocaleDateString('en-US', options);
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    // Format as "Tuesday, August 19th, 2025 at 2:15 PM EDT"
    const dayNum = date.getDate();
    const suffix = dayNum % 10 === 1 && dayNum !== 11 ? 'st' :
                   dayNum % 10 === 2 && dayNum !== 12 ? 'nd' :
                   dayNum % 10 === 3 && dayNum !== 13 ? 'rd' : 'th';
    
    const formattedDate = dateStr.replace(/\d+/, dayNum + suffix);
    return `${formattedDate} at ${displayHour}:${minutes} ${ampm} EDT`;
  };

  // Handle form submission
  const handleSubmitBooking = async () => {
    // Validate required fields
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      setSubmissionError('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      setSubmissionError('Please enter a valid email address');
      return;
    }

    // Validate phone number (basic validation)
    const phoneDigits = customerInfo.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setSubmissionError('Please enter a valid phone number');
      return;
    }

    if (!selectedService || !selectedDateTime.date || !selectedDateTime.time) {
      setSubmissionError('Missing appointment details');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch(`/api/public/${userId}/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDateTime.date.toISOString().split('T')[0],
          time: selectedDateTime.time,
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      // Success! Show confirmation
      console.log('Booking successful:', data);
      alert(`Appointment booked successfully! Confirmation ID: ${data.appointment.id}`);
      
      // Reset form and go back to categories
      setCustomerInfo({ firstName: '', lastName: '', email: '', phone: '' });
      setSelectedDateTime({ date: null, time: null });
      setSelectedService(null);
      setSelectedCategoryData(null);
      setCurrentView('categories');
      
    } catch (error) {
      console.error('Booking error:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const visibleCategories = getVisibleCategories();

  // Current view state management

  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{ 
        fontFamily: config.fontFamily,
        '--primary-color': config.primaryColor,
        '--secondary-color': config.secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Scheduling Page
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <button className="hover:text-gray-700 transition-colors">
                SIGN UP
              </button>
              <button className="hover:text-gray-700 transition-colors">
                LOGIN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Welcome Message */}
          {config.welcomeMessage && (
            <div className="p-6 border-b border-gray-200">
              <p className="text-gray-700">{config.welcomeMessage}</p>
            </div>
          )}

          <div className="p-6">
            {currentView === 'categories' && (
              <>
                {/* Category Selection Header */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-lg">📋</span>
                    <h2 className="text-lg font-semibold text-gray-900">Select Category</h2>
                  </div>
                </div>

                {/* Categories List */}
                <div className="space-y-4 mb-8">
                  {visibleCategories.length > 0 ? (
                    visibleCategories.map((category) => (
                      <div 
                        key={category.id} 
                        className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-gray-600 text-sm mb-2">
                                {category.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {category.services.filter(s => s.isVisible).length} services available
                            </p>
                          </div>
                          <button
                            onClick={() => handleCategorySelect(category)}
                            className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 transition-opacity cursor-pointer"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            SELECT
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">No services are currently available for booking.</p>
                      <p className="text-sm text-gray-400">Please check back later.</p>
                    </div>
                  )}
                </div>

                {/* Show All Appointments Link */}
                {config.allowOnlineBooking && (
                  <div className="text-center border-t border-gray-200 pt-6">
                    <button
                      onClick={handleShowAllAppointments}
                      className="text-sm font-medium tracking-wide hover:opacity-70 transition-opacity cursor-pointer"
                      style={{ color: config.secondaryColor }}
                    >
                      SHOW ALL APPOINTMENTS
                    </button>
                  </div>
                )}
              </>
            )}

            {currentView === 'services' && selectedCategoryData && (
              <>
                {/* Services View */}
                {/* Back Navigation Header */}
                <div className="mb-6">
                  <button
                    onClick={handleBackToCategories}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">SELECT CATEGORY</span>
                  </button>
                  
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Select Appointment</h2>
                  </div>
                </div>

                {/* Category Name */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedCategoryData.name}
                  </h3>
                </div>

                {/* Services List */}
                <div className="space-y-4">
                  {selectedCategoryData.services?.filter(service => service.isVisible)?.length > 0 ? (
                    selectedCategoryData.services
                      .filter(service => service.isVisible)
                      .map((service) => (
                        <div 
                          key={service.id}
                          className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {service.name}
                              </h4>
                              <p className="text-gray-600 mb-2">
                                {formatServiceSummary(service.duration, service.price)}
                              </p>
                              {service.description && (
                                <p className="text-gray-600 text-sm">
                                  {service.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleServiceSelect(service)}
                              className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors ml-4 cursor-pointer"
                            >
                              SELECT
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No services available in this category.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {currentView === 'calendar' && selectedService && (
              <>
                {/* Calendar View */}
                {/* Service Summary Section */}
                <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {selectedService.name}
                      </h3>
                      <p className="text-gray-600">
                        {formatServiceSummary(selectedService.duration, selectedService.price)}
                      </p>
                      {selectedService.description && (
                        <p className="text-gray-600 text-sm mt-2">
                          {selectedService.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleBackToServices}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Calendar & Time Selection Section */}
                <div className="space-y-6">
                  {/* Back Navigation */}
                  <div className="mb-6">
                    <button
                      onClick={handleBackToServices}
                      className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">SELECT SERVICE</span>
                    </button>
                  </div>

                  {/* Calendar Component */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Select Date & Time</h4>
                      <p className="text-sm text-gray-500">Choose your preferred appointment date and time</p>
                    </div>
                    
                    <Calendar
                      userId={userId}
                      serviceDuration={selectedService.duration}
                      onDateTimeSelect={handleDateTimeSelect}
                    />
                  </div>
                </div>
              </>
            )}

            {currentView === 'customerInfo' && selectedService && selectedDateTime.date && selectedDateTime.time && (
              <>
                {/* Customer Information View */}
                {/* Back Navigation */}
                <div className="mb-6">
                  <button
                    onClick={handleBackToCalendar}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">DATE & TIME</span>
                  </button>
                </div>

                {/* Appointment Summary */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
                  
                  {/* Appointment Details Bubble */}
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">APPOINTMENT</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {selectedService.name}
                        </h4>
                        <p className="text-gray-600">
                          {formatServiceDuration(selectedService.duration)} @ ${selectedService.price.toFixed(2)}
                        </p>
                        <p className="text-gray-600 mt-2">
                          {formatAppointmentDateTime(selectedDateTime.date, selectedDateTime.time)}
                        </p>
                      </div>
                      {selectedService.description && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            {selectedService.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Information Form */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-medium text-gray-600">YOUR INFORMATION</h3>
                    
                    {/* First Name */}
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        FIRST NAME<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        LAST NAME<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        PHONE<span className="text-red-500">*</span>
                      </label>
                      <div className="flex">
                        <div className="flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50">
                          <span className="text-sm">🇺🇸 +1</span>
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                          placeholder="(555) 123-4567"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        EMAIL<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        placeholder="Add..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use a comma or press enter/return to add additional email addresses
                      </p>
                    </div>

                    {/* Notes (Optional) */}
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        ADDITIONAL NOTES
                      </label>
                      <textarea
                        id="notes"
                        value={customerInfo.notes}
                        onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Any special requests or information..."
                      />
                    </div>

                    {/* Error Message */}
                    {submissionError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{submissionError}</p>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-6">
                      <button
                        onClick={handleSubmitBooking}
                        disabled={isSubmitting}
                        className="w-full px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {isSubmitting ? 'BOOKING...' : 'BOOK APPOINTMENT'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 text-center">
            <div className="text-xs text-gray-500 mb-1">
              Powered by
            </div>
            <div className="text-sm font-medium text-gray-900">
              another schedulr
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBookingPage;