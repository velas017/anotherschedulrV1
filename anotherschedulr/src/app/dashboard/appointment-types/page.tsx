"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboardLayout';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Edit,
  Copy,
  HelpCircle,
  MoreVertical
} from 'lucide-react';
import NewServiceModal from '@/components/newServiceModal';

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

const AppointmentTypesPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'types' | 'addons' | 'coupons'>('types');

  // Fetch services and categories
  useEffect(() => {
    fetchData();
  }, []);

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
        // Expand all categories by default
        setExpandedCategories(new Set(categoriesData.map((cat: ServiceCategory) => cat.id)));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEditService = (service: Service) => {
    router.push(`/dashboard/appointment-types/${service.id}/edit`);
  };

  const handleDuplicateService = async (service: Service) => {
    try {
      const duplicatedService = {
        ...service,
        name: `${service.name} (Copy)`,
        id: undefined
      };
      
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedService)
      });

      if (response.ok) {
        fetchData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error duplicating service:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} hour ${mins} minutes` : `${hours} hour`;
  };

  const formatServiceDescription = (service: Service) => {
    const parts = [];
    parts.push(`${formatDuration(service.duration)} @ $${service.price.toFixed(2)}`);
    
    if (service.paddingTime) {
      parts.push(`with ${service.paddingTime} minutes padding after`);
    }
    
    return `(${parts.join(' ')})`;
  };

  // Group services by category
  const getCategoriesWithServices = () => {
    const categoriesMap = new Map<string, ServiceCategory & { services: Service[] }>();
    
    // Initialize with existing categories
    categories.forEach(cat => {
      categoriesMap.set(cat.id, { ...cat, services: [] });
    });

    // Add uncategorized category if needed
    const uncategorizedServices: Service[] = [];

    // Group services
    services.forEach(service => {
      if (service.category?.id && categoriesMap.has(service.category.id)) {
        categoriesMap.get(service.category.id)!.services.push(service);
      } else if (!service.category) {
        uncategorizedServices.push(service);
      }
    });

    // Convert to array and add uncategorized if needed
    const result = Array.from(categoriesMap.values());
    
    if (uncategorizedServices.length > 0) {
      result.push({
        id: 'uncategorized',
        name: 'Uncategorized Services',
        description: null,
        sortOrder: 999,
        isVisible: true,
        services: uncategorizedServices,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const renderContent = () => {
    if (activeTab !== 'types') {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              {activeTab === 'addons' ? 'Add-ons' : 'Coupons'} feature coming soon
            </p>
          </div>
        </div>
      );
    }

    const categoriesWithServices = getCategoriesWithServices();
    const hasServices = services.length > 0;

    if (!hasServices) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointment types yet</h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Create your first appointment type to start accepting bookings. Add services like consultations, treatments, or sessions.
            </p>
            <button
              onClick={() => router.push('/dashboard/appointment-types/new')}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
            >
              NEW TYPE OF SERVICE
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 p-6">
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Categories are sorted alphabetically. Click and drag appointment types to reorder or move them to a new category.
            <button className="ml-1 text-blue-600 hover:text-blue-700 underline">
              Learn more »
            </button>
          </p>
        </div>

        <div className="space-y-6">
          {categoriesWithServices.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Category Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center space-x-2 text-left"
                  >
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Direct Scheduling Link
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Services List */}
              {expandedCategories.has(category.id) && (
                <div className="divide-y divide-gray-100">
                  {category.services.map((service) => (
                    <div key={service.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-1 h-12 bg-green-500 rounded"></div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900">
                                {service.name} {formatServiceDescription(service)}
                              </h4>
                              {service.isPrivate && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                                  Private
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDuplicateService(service)}
                            className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                          >
                            DUPLICATE
                          </button>
                          <button className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                            <span>Direct Scheduling Link</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout
      title="Appointment Types"
      subtitle="Manage your services and appointment types"
      rightContent={
        <HelpCircle className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
      }
    >
      <div className="flex h-full">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Types</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('types')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'types'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Types
              </button>
              <button
                onClick={() => setActiveTab('addons')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'addons'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Add-ons
              </button>
              <button
                onClick={() => setActiveTab('coupons')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'coupons'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Coupons
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Action Bar */}
          {activeTab === 'types' && services.length > 0 && (
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <button
                onClick={() => router.push('/dashboard/appointment-types/new')}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
              >
                NEW TYPE OF SERVICE
              </button>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading services...</p>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>

      {/* New Service Modal */}
      {isNewServiceModalOpen && (
        <NewServiceModal
          isOpen={isNewServiceModalOpen}
          onClose={() => {
            setIsNewServiceModalOpen(false);
            setSelectedService(null);
          }}
          service={selectedService}
          categories={categories}
          onSuccess={() => {
            fetchData();
            setIsNewServiceModalOpen(false);
            setSelectedService(null);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default AppointmentTypesPage;