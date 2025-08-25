"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  Edit,
  Copy,
  HelpCircle,
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';
import NewServiceModal from '@/components/newServiceModal';
import AddOnDrawer from '@/components/AddOnDrawer';

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

interface AddOn {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isAdminOnly: boolean;
  isVisible: boolean;
  sortOrder: number;
  associatedServicesCount: number;
  associatedServices: Array<{
    id: string;
    name: string;
  }>;
}

const AppointmentTypesPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<'types' | 'addons' | 'coupons'>('types');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'duration' | 'price'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isAddOnDrawerOpen, setIsAddOnDrawerOpen] = useState(false);

  // Fetch services and categories
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'addons') {
      fetchAddOns();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === 'types') {
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
      } else if (activeTab === 'addons') {
        const addOnsRes = await fetch('/api/addons');
        if (addOnsRes.ok) {
          const addOnsData = await addOnsRes.json();
          setAddOns(addOnsData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddOns = async () => {
    try {
      const addOnsRes = await fetch('/api/addons');
      if (addOnsRes.ok) {
        const addOnsData = await addOnsRes.json();
        setAddOns(addOnsData);
      }
    } catch (error) {
      console.error('Error fetching add-ons:', error);
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

  // Add-on management functions
  const handleSelectAllAddOns = () => {
    if (selectedAddOns.length === addOns.length) {
      setSelectedAddOns([]);
    } else {
      setSelectedAddOns(addOns.map(addOn => addOn.id));
    }
  };

  const handleSelectAddOn = (addOnId: string) => {
    if (selectedAddOns.includes(addOnId)) {
      setSelectedAddOns(selectedAddOns.filter(id => id !== addOnId));
    } else {
      setSelectedAddOns([...selectedAddOns, addOnId]);
    }
  };

  const handleSort = (field: 'name' | 'duration' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedAddOns = () => {
    const sorted = [...addOns].sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];
      
      if (sortField === 'name') {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sorted;
  };

  const handleEditAddOn = (addOn: AddOn) => {
    // TODO: Open edit modal
    console.log('Edit add-on:', addOn);
  };

  const handleDuplicateAddOn = async (addOn: AddOn) => {
    try {
      const duplicatedAddOn = {
        ...addOn,
        name: `${addOn.name} (Copy)`,
        id: undefined
      };
      
      const response = await fetch('/api/addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedAddOn)
      });

      if (response.ok) {
        fetchAddOns(); // Refresh the data
      }
    } catch (error) {
      console.error('Error duplicating add-on:', error);
    }
  };

  const handleDeleteAddOn = async (addOnId: string) => {
    if (!confirm('Are you sure you want to delete this add-on?')) {
      return;
    }

    try {
      const response = await fetch(`/api/addons/${addOnId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAddOns(); // Refresh the data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete add-on');
      }
    } catch (error) {
      console.error('Error deleting add-on:', error);
      alert('Failed to delete add-on');
    }
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
    // Handle Add-ons tab
    if (activeTab === 'addons') {
      const sortedAddOns = getSortedAddOns();
      const hasAddOns = addOns.length > 0;

      if (!hasAddOns) {
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No add-ons yet</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Add-ons are extras customers can select while scheduling their appointment or class.
              </p>
              <button
                onClick={() => setIsAddOnDrawerOpen(true)}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
              >
                CREATE ADD-ON
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="flex-1 p-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Add-ons are extras customers can select while scheduling their appointment or class.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col" style={{ maxHeight: 'calc(100vh - 168px)' }}>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.length === addOns.length && addOns.length > 0}
                      onChange={handleSelectAllAddOns}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Name</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('duration')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Duration</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('price')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Price</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin-only
                  </th>
                  <th className="w-12 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAddOns.map((addOn) => (
                  <tr key={addOn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedAddOns.includes(addOn.id)}
                        onChange={() => handleSelectAddOn(addOn.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 underline cursor-pointer">
                          {addOn.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {addOn.associatedServicesCount} appointment types
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {addOn.duration === 0 ? '0 minutes' : formatDuration(addOn.duration)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${addOn.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                      {addOn.isAdminOnly ? '—' : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button 
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                          onClick={() => {
                            // TODO: Implement dropdown menu
                            const action = prompt('Choose action: edit, duplicate, delete');
                            if (action === 'edit') handleEditAddOn(addOn);
                            else if (action === 'duplicate') handleDuplicateAddOn(addOn);
                            else if (action === 'delete') handleDeleteAddOn(addOn.id);
                          }}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      );
    }

    // Handle Coupons tab
    if (activeTab === 'coupons') {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              Coupons feature coming soon
            </p>
          </div>
        </div>
      );
    }

    // Handle Types tab (existing functionality)

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
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Match Client Page */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mb-8">
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">BACK</span>
          </Link>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Appointment Types</h2>
            
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('types')}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'types'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Types
              </button>
              <button
                onClick={() => setActiveTab('addons')}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'addons'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Add-ons
              </button>
              <button
                onClick={() => setActiveTab('coupons')}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'coupons'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Coupons
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-50 h-screen overflow-hidden">
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
        {activeTab === 'addons' && addOns.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <button
              onClick={() => setIsAddOnDrawerOpen(true)}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors"
            >
              CREATE ADD-ON
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

      {/* Add-On Drawer */}
      <AddOnDrawer
        isOpen={isAddOnDrawerOpen}
        onClose={() => setIsAddOnDrawerOpen(false)}
        onSuccess={() => {
          fetchAddOns();
          console.log('✅ Add-on created successfully - refreshing list');
        }}
      />
    </div>
  );
};

export default AppointmentTypesPage;