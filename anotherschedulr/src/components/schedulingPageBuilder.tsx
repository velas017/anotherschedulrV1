"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ChevronLeft, 
  Monitor, 
  Smartphone, 
  Settings,
  Palette,
  Link,
  Plus,
  Eye
} from 'lucide-react';
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

const SchedulingPageBuilder = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'preview' | 'styles' | 'settings' | 'link'>('preview');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFontFamily, setSelectedFontFamily] = useState<string>('Inter');
  
  // New state for category/services/calendar view management
  const [currentView, setCurrentView] = useState<'categories' | 'services' | 'calendar' | 'customerInfo'>('categories');
  const [selectedCategoryData, setSelectedCategoryData] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<{date: Date | null, time: string | null}>({date: null, time: null});
  
  // Customer form state
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Load saved font family from localStorage
  useEffect(() => {
    const savedFont = localStorage.getItem('schedulingPageFontFamily');
    if (savedFont) {
      setSelectedFontFamily(savedFont);
    }
  }, []);

  // Load Google Fonts for preview
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Roboto:wght@400;500;600&family=Open+Sans:wght@400;500;600&family=Lato:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Fetch services and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [servicesRes, categoriesRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/service-categories')
        ]);

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(servicesData);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'styles', label: 'Styles', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'link', label: 'Link', icon: Link }
  ];

  const getFilteredServices = () => {
    if (selectedCategory === 'all') {
      return services.filter(service => service.isVisible);
    }
    return services.filter(service => 
      service.isVisible && service.category?.id === selectedCategory
    );
  };

  const getCategoriesWithServices = () => {
    const visibleCategories = categories.filter(cat => cat.isVisible);
    return visibleCategories.map(category => ({
      ...category,
      services: services.filter(service => 
        service.isVisible && service.category?.id === category.id
      )
    }));
  };

  const handleFontFamilyChange = (font: string) => {
    setSelectedFontFamily(font);
    // Save to localStorage for persistence
    localStorage.setItem('schedulingPageFontFamily', font);
  };

  // Category selection handlers (matching public booking page functionality)
  const handleCategorySelect = useCallback((category: ServiceCategory) => {
    if (!category || !category.services || category.services.length === 0) {
      console.warn('Category has no services:', category);
      return;
    }
    
    setSelectedCategoryData(category);
    setCurrentView('services');
  }, []);

  const handleBackToCategories = useCallback(() => {
    setSelectedCategoryData(null);
    setCurrentView('categories');
  }, []);

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

  // Service formatting utilities (matching public booking page)
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
      // In the preview mode, just show a mock success message
      console.log('Preview mode booking:', {
        serviceId: selectedService.id,
        date: selectedDateTime.date.toISOString().split('T')[0],
        time: selectedDateTime.time,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        notes: customerInfo.notes
      });
      
      // Show success message
      alert('Preview booking submitted successfully! This is a preview mode.');
      
      // Reset form and go back to categories
      setCustomerInfo({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
      setSelectedDateTime({ date: null, time: null });
      setSelectedService(null);
      setSelectedCategoryData(null);
      setCurrentView('categories');
      
    } catch (error) {
      console.error('Booking error:', error);
      setSubmissionError('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Editor */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">BACK</span>
            </button>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">Scheduling Page</h1>
        </div>

        {/* Tab Navigation */}
        <div className="p-6">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Preview tab content - currently minimal */}
            </div>
          )}

          {activeTab === 'styles' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  defaultValue="#000000"
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <input
                  type="color"
                  defaultValue="#6b7280"
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select 
                  value={selectedFontFamily}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    hover:border-gray-400 transition-colors duration-200 cursor-pointer"
                  style={{ fontFamily: selectedFontFamily }}
                >
                  <option value="Inter" style={{ fontFamily: 'Inter' }}>Inter</option>
                  <option value="Roboto" style={{ fontFamily: 'Roboto' }}>Roboto</option>
                  <option value="Open Sans" style={{ fontFamily: 'Open Sans' }}>Open Sans</option>
                  <option value="Lato" style={{ fontFamily: 'Lato' }}>Lato</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Preview: <span style={{ fontFamily: selectedFontFamily }}>The quick brown fox jumps over the lazy dog</span>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message
                </label>
                <textarea
                  placeholder="Welcome to our booking page..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Allow Online Booking
                </label>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Require Approval
                </label>
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                />
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Booking URL
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm text-gray-800">
                    {session?.user?.id 
                      ? `${window.location.origin}/book/${session.user.id}`
                      : 'Loading...'}
                  </code>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Embed Code
                </label>
                <textarea
                  readOnly
                  value={session?.user?.id 
                    ? `<iframe src="${window.location.origin}/book/${session.user.id}" width="100%" height="600" frameborder="0"></iframe>`
                    : 'Loading...'}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Preview */}
      <div className="flex-1 flex flex-col">
        {/* Preview Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-black text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors cursor-pointer">
              EDIT TEXT
            </button>
            
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">Scheduling Page</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-2 rounded transition-colors cursor-pointer ${
                  previewDevice === 'desktop' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-2 rounded transition-colors cursor-pointer ${
                  previewDevice === 'mobile' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </button>
              <div className="ml-4 p-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 bg-gray-100 p-8 overflow-auto">
          <div 
            className={`mx-auto bg-white shadow-sm ${
              previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
            }`}
            style={{ fontFamily: selectedFontFamily }}
          >

            {/* Main Content - Categories, Services, or Calendar View */}
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
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="text-sm text-gray-500">Loading services...</div>
                      </div>
                    ) : categories.length > 0 ? (
                      categories.map((category) => {
                        const categoryWithServices = getCategoriesWithServices().find(cat => cat.id === category.id);
                        return (
                          <div key={category.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
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
                                  {categoryWithServices?.services?.filter(s => s.isVisible)?.length || 0} services available
                                </p>
                              </div>
                              <button
                                onClick={() => handleCategorySelect(categoryWithServices || category)}
                                className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                              >
                                SELECT
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">No services are currently available for booking.</p>
                        <p className="text-sm text-gray-400">Please check back later.</p>
                      </div>
                    )}
                  </div>

                  {/* Show All Appointments Link */}
                  <div className="text-center border-t border-gray-200 pt-6">
                    <button className="text-sm font-medium tracking-wide text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                      SHOW ALL APPOINTMENTS
                    </button>
                  </div>
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
                      
                      {session?.user?.id ? (
                        <Calendar
                          userId={session.user.id}
                          serviceDuration={selectedService.duration}
                          onDateTimeSelect={handleDateTimeSelect}
                          selectedDateTime={selectedDateTime}
                          previewDevice={previewDevice}
                        />
                      ) : (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                          <p className="text-gray-500 mt-2">Loading availability...</p>
                        </div>
                      )}
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
                    <div className="space-y-8">
                      <h3 className="text-sm font-medium text-gray-800 tracking-wide">YOUR INFORMATION</h3>
                      
                      {/* First Name */}
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 uppercase tracking-wide">
                          FIRST NAME<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={customerInfo.firstName}
                          onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                          className="w-full px-0 py-3 text-gray-900 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-gray-600 focus:ring-0 placeholder-gray-400"
                          required
                        />
                      </div>

                      {/* Last Name */}
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 uppercase tracking-wide">
                          LAST NAME<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={customerInfo.lastName}
                          onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                          className="w-full px-0 py-3 text-gray-900 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-gray-600 focus:ring-0 placeholder-gray-400"
                          required
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-900 uppercase tracking-wide">
                          PHONE<span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">🇺🇸</span>
                            <span className="text-gray-600 text-sm">+1</span>
                          </div>
                          <input
                            type="tel"
                            id="phone"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                            placeholder="1111111111"
                            className="flex-1 px-0 py-3 text-gray-900 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-gray-600 focus:ring-0 placeholder-gray-400"
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-900 uppercase tracking-wide">
                          EMAIL<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                          placeholder="Add..."
                          className="w-full px-0 py-3 text-gray-900 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-gray-600 focus:ring-0 placeholder-gray-400"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Use a comma or press enter/return to add additional email addresses
                        </p>
                      </div>

                      {/* Error Message */}
                      {submissionError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{submissionError}</p>
                        </div>
                      )}

                      {/* Submit Button */}
                      <div className="pt-8">
                        <button
                          onClick={handleSubmitBooking}
                          disabled={isSubmitting}
                          className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
                        >
                          {isSubmitting ? 'BOOKING...' : 'BOOK APPOINTMENT'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 text-center mt-8">
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
      </div>
    </div>
  );
};

export default SchedulingPageBuilder;