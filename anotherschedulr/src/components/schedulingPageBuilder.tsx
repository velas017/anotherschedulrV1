"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { buildSubdomainUrl } from '@/lib/subdomain-utils';
import { createColorVariants, validateHexColor, lightenColor } from '@/lib/color-utils';
import { 
  ChevronLeft, 
  Monitor, 
  Smartphone, 
  Settings,
  Palette,
  Link,
  Plus,
  Eye,
  Save,
  Check,
  X
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
  const [primaryColor, setPrimaryColor] = useState<string>('#000000');
  const [secondaryColor, setSecondaryColor] = useState<string>('#6b7280');
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Create color variants for theming
  const colorVariants = useMemo(() => {
    return createColorVariants(primaryColor, secondaryColor);
  }, [primaryColor, secondaryColor]);
  
  // Booking success handler
  const handleBookingSuccess = (appointment: any) => {
    console.log('Booking successful in preview:', appointment);
  };

  // Load all settings from database first, fallback to localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingColors(true);
        // First try to load from database
        const response = await fetch('/api/scheduling-page/settings');
        if (response.ok) {
          const settings = await response.json();
          if (settings.fontFamily) {
            setSelectedFontFamily(settings.fontFamily);
            localStorage.setItem('schedulingPageFontFamily', settings.fontFamily);
          }
          if (settings.primaryColor) {
            setPrimaryColor(settings.primaryColor);
          }
          if (settings.secondaryColor) {
            setSecondaryColor(settings.secondaryColor);
          }
        }
      } catch (error) {
        console.error('Error loading settings from database:', error);
        // Fallback to localStorage for font only
        const savedFont = localStorage.getItem('schedulingPageFontFamily');
        if (savedFont) {
          setSelectedFontFamily(savedFont);
        }
      } finally {
        setIsLoadingColors(false);
      }
    };

    loadSettings();
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

  const saveSettings = async (settings: { fontFamily?: string; primaryColor?: string; secondaryColor?: string }) => {
    try {
      console.log('Saving settings:', settings); // Debug log
      const response = await fetch('/api/scheduling-page/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to save settings - Status: ${response.status}, Response:`, errorText);
        
        // Show user-friendly error based on status
        if (response.status === 401) {
          console.error('Authentication error - please refresh the page and try again');
        } else if (response.status === 500) {
          console.error('Server error - please try again later');
        }
        return false;
      }
      
      const result = await response.json();
      console.log('Settings saved successfully:', result);
      return true;
      
    } catch (error) {
      console.error('Network error saving settings:', error);
      return false;
    }
  };

  // Debounced save function
  const debouncedSave = useCallback((settings: { fontFamily?: string; primaryColor?: string; secondaryColor?: string }) => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      console.log('Debounced save triggered:', settings);
      setSaveStatus('saving');
      const success = await saveSettings(settings);
      if (success) {
        setHasUnsavedChanges(false);
        setSaveStatus('success');
        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 500); // Wait 500ms after last change
  }, []);

  const handleFontFamilyChange = (font: string) => {
    setSelectedFontFamily(font);
    // Save to localStorage for immediate preview
    localStorage.setItem('schedulingPageFontFamily', font);
    setHasUnsavedChanges(true);
    
    if (autoSaveEnabled) {
      debouncedSave({ fontFamily: font });
    }
  };

  const handlePrimaryColorChange = (color: string) => {
    if (!validateHexColor(color)) {
      console.warn('Invalid hex color format:', color);
      return;
    }
    setPrimaryColor(color);
    setHasUnsavedChanges(true);
    
    if (autoSaveEnabled) {
      console.log('Queueing primary color save:', color);
      debouncedSave({ primaryColor: color });
    }
  };

  const handleSecondaryColorChange = (color: string) => {
    if (!validateHexColor(color)) {
      console.warn('Invalid hex color format:', color);
      return;
    }
    setSecondaryColor(color);
    setHasUnsavedChanges(true);
    
    if (autoSaveEnabled) {
      console.log('Queueing secondary color save:', color);
      debouncedSave({ secondaryColor: color });
    }
  };

  // Manual save function
  const handleManualSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    const success = await saveSettings({
      primaryColor,
      secondaryColor,
      fontFamily: selectedFontFamily
    });
    
    setIsSaving(false);
    
    if (success) {
      setHasUnsavedChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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
              {/* Save Mode Toggle */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Auto-save changes
                  </label>
                  <button
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      autoSaveEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {autoSaveEnabled 
                    ? 'Changes will be saved automatically after you stop editing'
                    : 'Click the save button to apply your changes'}
                </p>
              </div>

              {/* Manual Save Button */}
              {!autoSaveEnabled && hasUnsavedChanges && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  {saveStatus === 'success' && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Saved</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-1 text-red-600">
                      <X className="w-4 h-4" />
                      <span className="text-sm">Failed</span>
                    </div>
                  )}
                </div>
              )}

              {/* Auto-save Status Indicator */}
              {autoSaveEnabled && saveStatus !== 'idle' && (
                <div className="flex items-center gap-2 text-sm">
                  {saveStatus === 'saving' && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                  {saveStatus === 'success' && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-4 h-4" />
                      <span>Changes saved</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-1 text-red-600">
                      <X className="w-4 h-4" />
                      <span>Failed to save</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                    className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                    disabled={isLoadingColors}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => handlePrimaryColorChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded font-mono"
                    placeholder="#000000"
                    disabled={isLoadingColors}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Used for buttons, headings, and key elements
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => handleSecondaryColorChange(e.target.value)}
                    className="w-full h-10 rounded border border-gray-300 cursor-pointer"
                    disabled={isLoadingColors}
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => handleSecondaryColorChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded font-mono"
                    placeholder="#6b7280"
                    disabled={isLoadingColors}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Used for secondary text and subtle elements
                </p>
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
            className={`mx-auto shadow-sm ${
              previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
            }`}
            style={{ 
              fontFamily: selectedFontFamily,
              backgroundColor: colorVariants.secondaryLight || lightenColor(secondaryColor, 70)
            }}
          >
            {/* BookingInterface Component */}
            <div className="p-6">
              <BookingInterface
                userId={session?.user?.id || ''}
                mode="preview"
                session={session}
                config={{
                  primaryColor: primaryColor,
                  secondaryColor: secondaryColor,
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
              <div className="text-sm font-medium" style={{ color: primaryColor }}>
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