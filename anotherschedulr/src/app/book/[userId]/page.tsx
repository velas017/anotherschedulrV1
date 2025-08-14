"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

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
  const [currentView, setCurrentView] = useState<'categories' | 'services'>('categories');
  const [selectedCategoryData, setSelectedCategoryData] = useState<ServiceCategory | null>(null);
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

  const handleServiceSelect = (service: Service) => {
    // Future: Navigate to appointment booking
    console.log('Selected service:', service);
  };

  const handleShowAllAppointments = () => {
    // In a real implementation, this would show all available time slots
    console.log('Show all appointments');
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
            {currentView === 'categories' ? (
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
            ) : (
              <>
                {/* Services View */}
                {selectedCategoryData && (
                  <>
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