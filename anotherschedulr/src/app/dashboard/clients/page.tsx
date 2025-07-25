"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  ChevronLeft,
  Search,
  HelpCircle,
  MoreHorizontal,
  Check,
  ChevronDown,
  FileDown,
  FileUp,
  X,
  Loader2
} from "lucide-react";

interface Client {
  id: string;
  lastName: string;
  firstName: string;
  phone: string;
  email: string;
  accountActive: boolean;
}

const ClientsPage = () => {
  const { data: session, status } = useSession();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchResultsAnnouncement, setSearchResultsAnnouncement] = useState("");

  // Mock data for demonstration
  const [clients] = useState<Client[]>([
    {
      id: "1",
      lastName: "A",
      firstName: "Chua",
      phone: "(980) 253-7834",
      email: "aa.chua@yahoo.com",
      accountActive: false
    },
    {
      id: "2",
      lastName: "Alfaro",
      firstName: "Allyson",
      phone: "+17047269873",
      email: "nahomii704@gmail.com",
      accountActive: false
    },
    {
      id: "3",
      lastName: "Alvarenga",
      firstName: "Krissia",
      phone: "+17044216784",
      email: "alvarengakrissia@gmail.com",
      accountActive: false
    },
    {
      id: "4",
      lastName: "Amos",
      firstName: "Torri",
      phone: "+17022029905",
      email: "Torriamos@gmail.com",
      accountActive: false
    },
    {
      id: "5",
      lastName: "Antoine",
      firstName: "Ashley",
      phone: "+18609850909",
      email: "ashtravel29@gmail.com",
      accountActive: true
    },
    {
      id: "6",
      lastName: "Arana",
      firstName: "Mafer",
      phone: "+17044067040",
      email: "maferarana3@gmail.com",
      accountActive: false
    }
  ]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);

    if (searchTerm) {
      setIsSearching(true);
    }

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search when focused
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchTerm('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to access the client list</p>
          <Link href="/signin" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(client => client.id));
    }
  };

  const handleSelectClient = (clientId: string) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    } else {
      setSelectedClients([...selectedClients, clientId]);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(searchLower) ||
      client.lastName.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.phone.includes(debouncedSearchTerm)
    );
  });

  // Announce search results to screen readers
  useEffect(() => {
    if (debouncedSearchTerm) {
      const resultCount = filteredClients.length;
      const announcement = resultCount === 0 
        ? "No clients found" 
        : `${resultCount} client${resultCount === 1 ? '' : 's'} found`;
      setSearchResultsAnnouncement(announcement);
    } else {
      setSearchResultsAnnouncement("");
    }
  }, [filteredClients.length, debouncedSearchTerm]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mb-8">
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">BACK</span>
          </Link>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Clients</h2>
            
            <nav className="space-y-1">
              <Link 
                href="/dashboard/clients" 
                className="block px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg"
              >
                Client List
              </Link>
              
              <button
                onClick={() => setShowImportExport(!showImportExport)}
                className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Import/Export
              </button>
              
              {showImportExport && (
                <div className="ml-6 space-y-1">
                  <button className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                    <FileUp className="w-4 h-4 mr-2" />
                    Import Clients
                  </button>
                  <button className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                    <FileDown className="w-4 h-4 mr-2" />
                    Export Clients
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Client List</h1>
              <div className="flex items-center space-x-4">
                <button 
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Get help"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                <Link 
                  href="/dashboard/clients/new"
                  className="bg-black text-white px-6 py-2.5 rounded hover:bg-gray-800 text-sm font-medium
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    transition-colors duration-200"
                  aria-label="Add new client"
                >
                  ADD CLIENT
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button 
              className="flex items-center text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label="Filter clients"
              aria-expanded="false"
            >
              Show all clients
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            
            <div className="relative" role="search">
              <label htmlFor="client-search" className="sr-only">
                Search clients by name, email, or phone number
              </label>
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  id="client-search"
                  type="search"
                  placeholder="Search clients (⌘K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-10 py-2.5 w-80 border border-gray-300 rounded-lg text-sm 
                    text-gray-900 bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    hover:border-gray-400 transition-colors duration-200
                    placeholder:text-gray-500"
                  aria-label="Search clients"
                  aria-describedby="search-description"
                  autoComplete="off"
                />
                {(searchTerm || isSearching) && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" aria-label="Searching" />
                    ) : (
                      <button
                        onClick={handleClearSearch}
                        className="p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <span id="search-description" className="sr-only">
                Type to search for clients by name, email, or phone number. Press Escape to clear.
              </span>
            </div>
          </div>
          
          {/* Live region for search results announcement */}
          <div 
            className="sr-only" 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
          >
            {searchResultsAnnouncement}
          </div>
        </div>

        {/* Client Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === clients.length && clients.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="w-12 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.firstName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {client.accountActive && (
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <p className="text-gray-900 font-medium mb-2">No clients found</p>
                {debouncedSearchTerm ? (
                  <div>
                    <p className="text-gray-600 text-sm mb-4">
                      No results for "{debouncedSearchTerm}"
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Try:</p>
                      <ul className="list-disc list-inside space-y-1 text-left inline-block">
                        <li>Checking your spelling</li>
                        <li>Using fewer keywords</li>
                        <li>Searching by phone number</li>
                      </ul>
                    </div>
                    <button
                      onClick={handleClearSearch}
                      className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium focus:outline-none focus:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">
                    Start by adding your first client using the "ADD CLIENT" button above.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;