import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchPlaceholder: string;
  setSearchPlaceholder: (placeholder: string) => void;
  isSearchVisible: boolean;
  setIsSearchVisible: (visible: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPlaceholder, setSearchPlaceholder] = useState('Search records...');
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const location = useLocation();

  // Automatically reset search query and default placeholder on route change
  useEffect(() => {
    setSearchQuery('');
    // Check if on reports or specific pages that manage search independently
    if (location.pathname.startsWith('/reports')) {
      setIsSearchVisible(false);
    } else {
      setIsSearchVisible(true);
    }
  }, [location.pathname]);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchPlaceholder,
        setSearchPlaceholder,
        isSearchVisible,
        setIsSearchVisible,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
