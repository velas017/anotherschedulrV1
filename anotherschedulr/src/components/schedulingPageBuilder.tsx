"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Monitor, 
  Smartphone, 
  Settings,
  Palette,
  Code,
  Link,
  Plus,
  Eye
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'preview' | 'styles' | 'settings' | 'css' | 'link'>('preview');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);

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
    { id: 'css', label: 'Advanced CSS', icon: Code },
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

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Editor */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">BACK</span>
            </button>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">Scheduling Page</h1>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-3 text-sm font-medium border-b border-gray-100 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-50 text-gray-900 border-l-2 border-l-blue-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Service Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{category.name}</div>
                        <div className="text-xs text-gray-500">
                          {category.services?.length || 0} services
                        </div>
                      </div>
                      <button className="px-3 py-1 text-xs bg-gray-600 text-white rounded">
                        SELECT
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </button>
              </div>

              <div>
                <button className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  SHOW ALL APPOINTMENTS
                </button>
              </div>
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
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                </select>
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

          {activeTab === 'css' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom CSS
              </label>
              <textarea
                placeholder="/* Add your custom CSS here */"
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              />
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
                    https://yourapp.com/book/user123
                  </code>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Embed Code
                </label>
                <textarea
                  readOnly
                  value={`<iframe src="https://yourapp.com/book/user123" width="100%" height="600" frameborder="0"></iframe>`}
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
            <button className="px-4 py-2 bg-black text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors">
              EDIT TEXT
            </button>
            
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">Scheduling Page</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-2 rounded transition-colors ${
                  previewDevice === 'desktop' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-2 rounded transition-colors ${
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
          <div className={`mx-auto bg-white shadow-sm ${
            previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
          }`}>

            {/* Category Selector */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">📋</span>
                    <span className="text-sm font-medium">Select Category</span>
                  </div>
                </div>
              </div>

              {/* Services List */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="text-sm text-gray-500">Loading services...</div>
                  </div>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{category.name}</h3>
                          {category.description && (
                            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                          )}
                        </div>
                        <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                          SELECT
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-sm text-gray-500 mb-4">No service categories created yet</div>
                    <button className="text-sm text-blue-600 hover:text-blue-700">
                      Create your first category
                    </button>
                  </div>
                )}
              </div>

              {/* Show All Appointments Link */}
              <div className="mt-8 text-center">
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors uppercase tracking-wide">
                  SHOW ALL APPOINTMENTS
                </button>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center border-t border-gray-200 pt-6">
                <div className="text-xs text-gray-500">
                  Powered by
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">
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