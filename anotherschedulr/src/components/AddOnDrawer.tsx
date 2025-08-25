"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Service {
  id: string;
  name: string;
}

interface AddOnDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddOnDrawer: React.FC<AddOnDrawerProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [access, setAccess] = useState<'client-admin' | 'admin-only'>('client-admin');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [errors, setErrors] = useState<{name?: string; price?: string; duration?: string}>({});
  const [touched, setTouched] = useState<{name?: boolean; price?: boolean; duration?: boolean}>({});
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Fetch services when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchServices();
      // Focus first input when drawer opens
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
    } else {
      // Reset form when drawer closes
      resetForm();
    }
  }, [isOpen]);

  // Handle select all functionality
  useEffect(() => {
    if (selectAll) {
      setSelectedServices(services.map(s => s.id));
    } else if (selectedServices.length === services.length && services.length > 0) {
      // Don't clear if we're just loading
    } else {
      setSelectedServices([]);
    }
  }, [selectAll, services]);

  // Update select all checkbox when individual services change
  useEffect(() => {
    if (services.length > 0 && selectedServices.length === services.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedServices, services]);

  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setDuration('');
    setAccess('client-admin');
    setSelectedServices([]);
    setSelectAll(false);
    setErrors({});
    setTouched({});
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (price === '') {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = 'Price must be a valid number >= 0';
    }
    
    if (duration === '') {
      newErrors.duration = 'Duration is required';
    } else if (isNaN(Number(duration)) || Number(duration) < 0) {
      newErrors.duration = 'Duration must be a valid number >= 0';
    } else if (Number(duration) > 480) {
      newErrors.duration = 'Duration cannot exceed 480 minutes (8 hours)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched({ name: true, price: true, duration: true });
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/addons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
          duration: Number(duration),
          isAdminOnly: access === 'admin-only',
          isVisible: true,
          serviceIds: selectedServices,
        }),
      });

      if (response.ok) {
        const createdAddOn = await response.json();
        console.log('✅ Add-on created successfully:', createdAddOn);
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        console.error('❌ Error creating add-on:', error);
        // Could show error toast here
      }
    } catch (error) {
      console.error('Error creating add-on:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSelectAllToggle = () => {
    setSelectAll(!selectAll);
  };

  const handleBlur = (field: 'name' | 'price' | 'duration') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Trap focus within drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = drawerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const isFormValid = name.trim() && price !== '' && duration !== '';

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cancel and close"
              >
                CANCEL
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                isFormValid && !isLoading
                  ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'CREATING...' : 'CREATE'}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 id="drawer-title" className="text-xl font-semibold mb-6 text-gray-900">New add-on</h2>

            {/* Name Field */}
            <div className="mb-6">
              <label htmlFor="addon-name" className="block text-sm font-medium text-gray-900 mb-2">
                NAME <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                id="addon-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Foot massage"
                className={`w-full px-3 py-2 border rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-required="true"
                aria-invalid={touched.name && !!errors.name}
                aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
              />
              {touched.name && errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Price Field */}
            <div className="mb-6">
              <label htmlFor="addon-price" className="block text-sm font-medium text-gray-900 mb-2">
                ADDITIONAL PRICE <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="addon-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={() => handleBlur('price')}
                  placeholder="10"
                  step="0.01"
                  min="0"
                  className={`flex-1 px-3 py-2 border rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    touched.price && errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-required="true"
                  aria-invalid={touched.price && !!errors.price}
                  aria-describedby={`addon-price-currency ${touched.price && errors.price ? 'price-error' : 'price-help'}`}
                />
                <span id="addon-price-currency" className="text-gray-500 text-sm whitespace-nowrap">
                  US Dollar (USD)
                </span>
              </div>
              {touched.price && errors.price ? (
                <p id="price-error" className="mt-1 text-sm text-red-600">{errors.price}</p>
              ) : (
                <p id="price-help" className="mt-1 text-sm text-gray-600">
                  Set price to $0 to make add-on free and not display price to clients
                </p>
              )}
            </div>

            {/* Duration Field */}
            <div className="mb-6">
              <label htmlFor="addon-duration" className="block text-sm font-medium text-gray-900 mb-2">
                ADDITIONAL DURATION <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="addon-duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  onBlur={() => handleBlur('duration')}
                  placeholder="10"
                  min="0"
                  max="480"
                  className={`flex-1 px-3 py-2 border rounded-lg text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    touched.duration && errors.duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-required="true"
                  aria-invalid={touched.duration && !!errors.duration}
                  aria-describedby={`addon-duration-unit ${touched.duration && errors.duration ? 'duration-error' : 'duration-help'}`}
                />
                <span id="addon-duration-unit" className="text-gray-500 text-sm whitespace-nowrap">
                  Minutes
                </span>
              </div>
              {touched.duration && errors.duration ? (
                <p id="duration-error" className="mt-1 text-sm text-red-600">{errors.duration}</p>
              ) : (
                <p id="duration-help" className="mt-1 text-sm text-gray-600">
                  Set duration to 0 to make add-on no additional time
                </p>
              )}
            </div>

            {/* Access Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">ACCESS</h3>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="access"
                    value="client-admin"
                    checked={access === 'client-admin'}
                    onChange={() => setAccess('client-admin')}
                    className="mr-3 cursor-pointer"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Client and Admin</span>
                    <p className="text-sm text-gray-600">Clients can book this add-on.</p>
                  </div>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="access"
                    value="admin-only"
                    checked={access === 'admin-only'}
                    onChange={() => setAccess('admin-only')}
                    className="mr-3 cursor-pointer"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Admin-only</span>
                    <p className="text-sm text-gray-600">
                      Only admins can book this add-on when manually scheduling an appointment with a client.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Available For Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">AVAILABLE FOR</h3>
              {isLoadingServices ? (
                <div className="text-gray-500">Loading services...</div>
              ) : services.length === 0 ? (
                <div className="text-gray-500">No services available</div>
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAllToggle}
                      className="mr-3 cursor-pointer"
                    />
                    <span className="font-medium text-gray-900">Select All</span>
                  </label>
                  <div className="ml-6 space-y-2 max-h-60 overflow-y-auto">
                    {services.map((service) => (
                      <label key={service.id} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          className="mr-3 cursor-pointer"
                        />
                        <span className="text-gray-900">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddOnDrawer;