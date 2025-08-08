"use client";

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isVisible: boolean;
  sortOrder: number;
  paddingTime?: number;
  isPrivate?: boolean;
  categoryId?: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
  services: Service[];
}

interface NewAppointmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewAppointmentPanel: React.FC<NewAppointmentPanelProps> = ({ isOpen, onClose }) => {
  const [isAppointmentTypeExpanded, setIsAppointmentTypeExpanded] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  
  // Client Name section state
  const [isClientNameExpanded, setIsClientNameExpanded] = useState(false);
  
  // Client form fields
  const [clientForm, setClientForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({
    firstName: false,
    lastName: false
  });

  // Fetch service categories when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchServiceCategories();
    }
  }, [isOpen]);

  const fetchServiceCategories = async () => {
    try {
      setIsLoadingServices(true);
      const response = await fetch('/api/service-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching service categories:', error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setIsAppointmentTypeExpanded(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour ${mins} minutes`;
  };

  // Client form handlers
  const handleClientFormChange = (field: keyof typeof clientForm, value: string) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing
    if (field === 'firstName' || field === 'lastName') {
      setFormErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const validateClientForm = () => {
    const errors = {
      firstName: clientForm.firstName.trim() === '',
      lastName: clientForm.lastName.trim() === ''
    };
    
    setFormErrors(errors);
    return !errors.firstName && !errors.lastName;
  };

  const formSections = [
    {
      id: 'date-time',
      label: 'Date & Time',
      onClick: () => console.log('Date & Time clicked')
    },
    {
      id: 'forms-notes',
      label: 'Forms, Code and Notes',
      onClick: () => console.log('Forms, Code and Notes clicked')
    }
  ];

  return (
    <>
      {/* Slide-out Panel */}
      <div 
        className={`fixed right-0 top-0 min-h-full w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={onClose}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex items-center">
              <div className="bg-gray-600 text-white px-4 py-2 rounded-t-lg font-medium text-sm">
                New Appointment
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="space-y-1">
            {/* Appointment Type Section - Expandable */}
            <div className="relative">
              <button
                onClick={() => setIsAppointmentTypeExpanded(!isAppointmentTypeExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-gray-900 font-medium text-left">
                    Appointment Type
                  </span>
                  {selectedService && (
                    <span className="text-sm text-gray-500 mt-1">
                      {selectedService.name} • {formatDuration(selectedService.duration)} • {formatPrice(selectedService.price)}
                    </span>
                  )}
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${
                    isAppointmentTypeExpanded ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Dropdown Content */}
              {isAppointmentTypeExpanded && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  {isLoadingServices ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading services...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No services available. Please create services first.
                    </div>
                  ) : (
                    <div className="py-2">
                      {/* Selected Service Indicator */}
                      {selectedService && (
                        <div className="px-4 py-2 mx-2 mb-2 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Check className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-700">
                                Choose appointment type...
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Service Categories and Services */}
                      {categories.map((category) => (
                        <div key={category.id} className="mb-2">
                          {/* Category Header */}
                          <div className="px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {category.name}
                          </div>
                          
                          {/* Services in this category */}
                          <div>
                            {category.services.filter(s => s.isVisible).map((service) => (
                              <button
                                key={service.id}
                                onClick={() => handleServiceSelect(service)}
                                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                  selectedService?.id === service.id ? 'bg-red-50' : ''
                                }`}
                              >
                                <div className="flex-1 text-left">
                                  <div className="flex items-center space-x-2">
                                    <span className={`font-medium ${
                                      selectedService?.id === service.id ? 'text-red-700' : 'text-gray-900'
                                    }`}>
                                      {service.name}
                                    </span>
                                    {service.isPrivate && (
                                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                                        Private
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-0.5">
                                    {formatDuration(service.duration)} @ {formatPrice(service.price)}
                                  </div>
                                  {service.description && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {service.description}
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className={`w-5 h-5 ${
                                  selectedService?.id === service.id ? 'text-red-600' : 'text-gray-400'
                                }`} />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Client Name Section - Expandable */}
            <div className="w-full">
              <button
                onClick={() => setIsClientNameExpanded(!isClientNameExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-gray-900 font-medium text-left">
                    Client Name
                  </span>
                  {(clientForm.firstName || clientForm.lastName) && (
                    <span className="text-sm text-gray-500 mt-1">
                      {clientForm.firstName} {clientForm.lastName}
                    </span>
                  )}
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${
                    isClientNameExpanded ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Client Form Content */}
              {isClientNameExpanded && (
                <div className="w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-6 space-y-4">
                    {/* First Name - Required */}
                    <div>
                      <input
                        type="text"
                        placeholder="First Name *"
                        value={clientForm.firstName}
                        onChange={(e) => handleClientFormChange('firstName', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 bg-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          hover:border-gray-400 transition-colors duration-200
                          placeholder:text-gray-500 ${
                          formErrors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.firstName && (
                        <p className="text-red-600 text-sm mt-1">First name is required</p>
                      )}
                    </div>

                    {/* Last Name - Required */}
                    <div>
                      <input
                        type="text"
                        placeholder="Last Name *"
                        value={clientForm.lastName}
                        onChange={(e) => handleClientFormChange('lastName', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm text-gray-900 bg-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          hover:border-gray-400 transition-colors duration-200
                          placeholder:text-gray-500 ${
                          formErrors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.lastName && (
                        <p className="text-red-600 text-sm mt-1">Last name is required</p>
                      )}
                    </div>

                    {/* Phone - Optional */}
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={clientForm.phone}
                        onChange={(e) => handleClientFormChange('phone', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          hover:border-gray-400 transition-colors duration-200
                          placeholder:text-gray-500"
                      />
                    </div>

                    {/* Email - Optional */}
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={clientForm.email}
                        onChange={(e) => handleClientFormChange('email', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          hover:border-gray-400 transition-colors duration-200
                          placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Form Sections */}
            {formSections.map((section) => (
              <button
                key={section.id}
                onClick={section.onClick}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg group"
              >
                <span className="text-gray-900 font-medium text-left">
                  {section.label}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <button 
              className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              <span>Schedule Appointment</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>

            <button 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewAppointmentPanel;