"use client";

import React, { useState, useEffect } from 'react';

interface Service {
  id?: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isVisible: boolean;
  sortOrder: number;
  paddingTime?: number;
  isPrivate?: boolean;
  categoryId?: string;
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
}

export interface ServiceFormData {
  name: string;
  description?: string;
  duration: number;
  price: number;
  paddingTime: number;
  isVisible: boolean;
  isPrivate: boolean;
  categoryId?: string;
  sortOrder?: number;
}

interface ServiceFormProps {
  service?: Service | null;
  categories: ServiceCategory[];
  onSubmit: (data: ServiceFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ 
  service, 
  categories, 
  onSubmit, 
  onCancel,
  isSubmitting = false 
}) => {
  const [formData, setFormData] = useState<Partial<ServiceFormData>>({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    paddingTime: 0,
    isVisible: true,
    isPrivate: false,
    categoryId: ''
  });
  
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        duration: service.duration,
        price: service.price,
        paddingTime: service.paddingTime || 0,
        isVisible: service.isVisible,
        isPrivate: service.isPrivate || false,
        categoryId: service.category?.id || '',
        sortOrder: service.sortOrder
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let categoryId = formData.categoryId;
    
    // Create new category if needed
    if (showNewCategory && newCategoryName) {
      setIsCreatingCategory(true);
      try {
        const categoryResponse = await fetch('/api/service-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName })
        });

        if (categoryResponse.ok) {
          const newCategory = await categoryResponse.json();
          categoryId = newCategory.id;
        }
      } catch (error) {
        console.error('Error creating category:', error);
      } finally {
        setIsCreatingCategory(false);
      }
    }

    // Submit the form data
    await onSubmit({
      name: formData.name!,
      description: formData.description,
      duration: formData.duration!,
      price: formData.price!,
      paddingTime: formData.paddingTime!,
      isVisible: formData.isVisible!,
      isPrivate: formData.isPrivate!,
      categoryId,
      sortOrder: formData.sortOrder
    });
  };

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 75, label: '1 hour 15 minutes' },
    { value: 90, label: '1 hour 30 minutes' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' }
  ];

  const paddingOptions = [
    { value: 0, label: 'No padding' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 25, label: '25 minutes' },
    { value: 30, label: '30 minutes' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Name */}
      <div>
        <label 
          htmlFor="service-name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Service Name <span className="text-red-500">*</span>
        </label>
        <input
          id="service-name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200 placeholder:text-gray-500"
          placeholder="e.g., 60 Minute Consultation"
          aria-describedby="service-name-description"
        />
        <span id="service-name-description" className="sr-only">
          Enter a descriptive name for your service
        </span>
      </div>

      {/* Category */}
      <div>
        <label 
          htmlFor="service-category"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Category
        </label>
        {!showNewCategory ? (
          <div className="space-y-2">
            <select
              id="service-category"
              value={formData.categoryId || ''}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200"
              aria-describedby="category-description"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <span id="category-description" className="sr-only">
              Select a category to organize your service, or create a new one
            </span>
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 transition-colors"
              aria-label="Create new service category"
            >
              + Create new category
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="new-category-name" className="sr-only">
                New category name
              </label>
              <input
                id="new-category-name"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200 placeholder:text-gray-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="New category name"
                disabled={isCreatingCategory}
                aria-describedby="new-category-help"
              />
              <span id="new-category-help" className="sr-only">
                Enter a name for the new service category
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryName('');
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded transition-colors"
                disabled={isCreatingCategory}
                aria-label="Cancel category creation"
              >
                Cancel
              </button>
              {isCreatingCategory && (
                <span className="text-sm text-gray-500" aria-live="polite">
                  Creating category...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label 
          htmlFor="service-description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Description
        </label>
        <textarea
          id="service-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200 placeholder:text-gray-500 resize-none"
          placeholder="Describe this service..."
          aria-describedby="description-help"
        />
        <span id="description-help" className="sr-only">
          Optional description to help clients understand what this service includes
        </span>
      </div>

      {/* Duration and Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label 
            htmlFor="service-duration"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Duration <span className="text-red-500">*</span>
          </label>
          <select
            id="service-duration"
            required
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200"
            aria-describedby="duration-help"
          >
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span id="duration-help" className="sr-only">
            Select how long this service appointment will take
          </span>
        </div>

        <div>
          <label 
            htmlFor="service-price"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Price <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" aria-hidden="true">
              $
            </span>
            <input
              id="service-price"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200 placeholder:text-gray-500"
              placeholder="0.00"
              aria-describedby="price-help"
            />
          </div>
          <span id="price-help" className="sr-only">
            Enter the price for this service in dollars
          </span>
        </div>
      </div>

      {/* Padding Time */}
      <div>
        <label 
          htmlFor="service-padding"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Padding Time After
        </label>
        <select
          id="service-padding"
          value={formData.paddingTime || 0}
          onChange={(e) => setFormData({ ...formData, paddingTime: parseInt(e.target.value) })}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200"
          aria-describedby="padding-help"
        >
          {paddingOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p id="padding-help" className="mt-2 text-sm text-gray-600">
          Buffer time after this appointment before the next one can be scheduled
        </p>
      </div>

      {/* Visibility Options */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700 mb-3">
          Visibility Settings
        </legend>
        
        <label className="flex items-start">
          <input
            id="service-visible"
            type="checkbox"
            checked={formData.isVisible}
            onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
            aria-describedby="visible-help"
          />
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-900">
              Show on public booking page
            </span>
            <p id="visible-help" className="text-sm text-gray-600 mt-1">
              When checked, clients can see and book this service on your public booking page
            </p>
          </div>
        </label>

        <label className="flex items-start">
          <input
            id="service-private"
            type="checkbox"
            checked={formData.isPrivate}
            onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
            aria-describedby="private-help"
          />
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-900">
              Private (only bookable by direct link)
            </span>
            <p id="private-help" className="text-sm text-gray-600 mt-1">
              When checked, this service can only be booked through a direct scheduling link
            </p>
          </div>
        </label>
      </fieldset>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-lg transition-colors"
          aria-label="Cancel service creation"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isCreatingCategory}
          className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={service ? 'Save changes to service' : 'Create new service'}
          aria-describedby="submit-status"
        >
          {isSubmitting ? 'Saving...' : (service ? 'Save Changes' : 'Create Service')}
        </button>
        {(isSubmitting || isCreatingCategory) && (
          <span id="submit-status" className="sr-only" aria-live="polite">
            {isSubmitting ? 'Saving service...' : 'Creating category...'}
          </span>
        )}
      </div>
    </form>
  );
};

export default ServiceForm;