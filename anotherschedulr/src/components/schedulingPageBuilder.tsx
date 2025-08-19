"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { buildSubdomainUrl } from '@/lib/subdomain-utils';
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
import BookingInterface from '@/components/BookingInterface';

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

const SchedulingPageBuilder: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'preview' | 'styles' | 'settings' | 'link'>('preview');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFontFamily, setSelectedFontFamily] = useState<string>('Inter');
  const [userSubdomain, setUserSubdomain] = useState<string | null>(null);
  
  // Booking success handler
  const handleBookingSuccess = (appointment: any) => {
    console.log('Booking successful in preview:', appointment);
  };

  // Load font family from database first, fallback to localStorage
  useEffect(() => {
    const loadFontSettings = async () => {
      try {
        // First try to load from database
        const response = await fetch('/api/scheduling-page/settings');
        if (response.ok) {
          const settings = await response.json();
          if (settings.fontFamily) {
            setSelectedFontFamily(settings.fontFamily);
            localStorage.setItem('schedulingPageFontFamily', settings.fontFamily);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading font settings from database:', error);
      }
      
      // Fallback to localStorage
      const savedFont = localStorage.getItem('schedulingPageFontFamily');
      if (savedFont) {
        setSelectedFontFamily(savedFont);
      }
    };

    loadFontSettings();
  }, []);

  // Load user's subdomain
  useEffect(() => {
    const loadUserSubdomain = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const userData = await response.json();
          setUserSubdomain(userData.subdomain);
        }
      } catch (error) {
        console.error('Error loading user subdomain:', error);
      }
    };

    loadUserSubdomain();
  }, [session?.user?.id]);

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

  const handleFontFamilyChange = async (font: string) => {
    setSelectedFontFamily(font);
    // Save to localStorage for immediate preview
    localStorage.setItem('schedulingPageFontFamily', font);
    
    // Save to database for public page persistence
    try {
      const response = await fetch('/api/scheduling-page/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fontFamily: font
        })
      });
      
      if (!response.ok) {
        console.error('Failed to save font family to database');
      }
    } catch (error) {
      console.error('Error saving font family:', error);
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
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200 cursor-pointer"
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
                    {userSubdomain 
                      ? buildSubdomainUrl(userSubdomain)
                      : session?.user?.id 
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
                  value={userSubdomain 
                    ? `<iframe src="${buildSubdomainUrl(userSubdomain)}" width="100%" height="600" frameborder="0"></iframe>`
                    : session?.user?.id 
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
            {/* BookingInterface Component */}
            <div className="p-6">
              <BookingInterface
                userId={session?.user?.id || ''}
                mode="preview"
                session={session}
                config={{
                  primaryColor: '#000000',
                  secondaryColor: '#6b7280',
                  fontFamily: selectedFontFamily,
                  allowOnlineBooking: true
                }}
                previewDevice={previewDevice}
                categories={getCategoriesWithServices()}
                isLoading={isLoading}
                onBookingSuccess={handleBookingSuccess}
              />
            </div>

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
  );
};

export default SchedulingPageBuilder;