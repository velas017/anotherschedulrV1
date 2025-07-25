"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronDown } from 'lucide-react';

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
}

const NewAppointmentTypePage = () => {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('details');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [showBlockTimeOptions, setShowBlockTimeOptions] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0.00,
    categoryId: '',
    showMessageAfterScheduling: false,
    messageAfterScheduling: '',
    blockTimeBefore: false,
    blockTimeAfter: false,
    blockTimeBeforeMinutes: 0,
    blockTimeAfterMinutes: 0,
    color: '#8B5CF6', // Default purple color
    isVisible: true,
    isPrivate: false
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/service-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const serviceData = {
        name: formData.name,
        description: formData.description,
        duration: formData.duration,
        price: formData.price,
        paddingTime: formData.blockTimeAfterMinutes,
        isVisible: formData.isVisible,
        isPrivate: formData.isPrivate,
        categoryId: formData.categoryId || undefined,
        // Additional fields can be stored in a metadata column or additional tables
      };

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });

      if (response.ok) {
        router.push('/dashboard/appointment-types');
      } else {
        throw new Error('Failed to create service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      // Could add error toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorOptions = [
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' }
  ];

  const sidebarSections = [
    { id: 'details', label: 'Details' },
    { id: 'image', label: 'Image' },
    { id: 'calendars', label: 'Calendars' },
    { id: 'forms', label: 'Forms' },
    { id: 'resources', label: 'Resources' }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/appointment-types')}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              BACK
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Create appointment type</h1>
              <p className="text-sm text-gray-600">Individual appointment</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name}
            className="px-6 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'CREATING...' : 'CREATE'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {sidebarSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-8">
            {activeSection === 'details' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Details</h2>
                  
                  {/* Name Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name*
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Deep Tissue Massage"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Description Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional Description"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-right text-sm text-gray-500 mt-1">
                      {formData.description.length}/512
                    </p>
                  </div>

                  {/* Message after scheduling */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowMessageOptions(!showMessageOptions)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">Show a message after scheduling</div>
                        <div className="text-sm text-gray-500">An optional message shown after booking on the confirmation screen.</div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showMessageOptions ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showMessageOptions && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            checked={formData.showMessageAfterScheduling}
                            onChange={(e) => setFormData({ ...formData, showMessageAfterScheduling: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Enable confirmation message</span>
                        </label>
                        {formData.showMessageAfterScheduling && (
                          <textarea
                            value={formData.messageAfterScheduling}
                            onChange={(e) => setFormData({ ...formData, messageAfterScheduling: e.target.value })}
                            placeholder="Enter your confirmation message..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration in minutes*
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      min="5"
                      step="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Block time before/after */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowBlockTimeOptions(!showBlockTimeOptions)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">Block off time before or after appointment</div>
                        <div className="text-sm text-gray-500">Padding only visible to admins to help you build breaks in your schedule.</div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showBlockTimeOptions ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showBlockTimeOptions && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.blockTimeBefore}
                              onChange={(e) => setFormData({ ...formData, blockTimeBefore: e.target.checked })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Block time before appointment</span>
                          </label>
                          {formData.blockTimeBefore && (
                            <input
                              type="number"
                              value={formData.blockTimeBeforeMinutes}
                              onChange={(e) => setFormData({ ...formData, blockTimeBeforeMinutes: parseInt(e.target.value) || 0 })}
                              min="0"
                              step="5"
                              placeholder="Minutes"
                              className="mt-2 w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.blockTimeAfter}
                              onChange={(e) => setFormData({ ...formData, blockTimeAfter: e.target.checked })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Block time after appointment</span>
                          </label>
                          {formData.blockTimeAfter && (
                            <input
                              type="number"
                              value={formData.blockTimeAfterMinutes}
                              onChange={(e) => setFormData({ ...formData, blockTimeAfterMinutes: parseInt(e.target.value) || 0 })}
                              min="0"
                              step="5"
                              placeholder="Minutes"
                              className="mt-2 w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category*
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">None</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                      CREATE NEW CATEGORY
                    </button>
                  </div>

                  {/* Color */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setFormData({ ...formData, color: color.value })}
                            className={`w-8 h-8 rounded-full border-2 ${
                              formData.color === color.value ? 'border-gray-900' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color.value }}
                            aria-label={`Select ${color.name} color`}
                          />
                        ))}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'image' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Image upload functionality coming soon</p>
              </div>
            )}

            {activeSection === 'calendars' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Calendar integration coming soon</p>
              </div>
            )}

            {activeSection === 'forms' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Custom forms functionality coming soon</p>
              </div>
            )}

            {activeSection === 'resources' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Resource management coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentTypePage;