import { Search, X } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

export default function GlobalSearchBar() {
  const { searchQuery, setSearchQuery, searchPlaceholder, isSearchVisible } = useSearch();

  if (!isSearchVisible) return null;

  return (
    <div className="relative w-64 md:w-72 hidden sm:block ml-4">
      <Search className="w-3.5 h-3.5 text-studio-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        placeholder={searchPlaceholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-8 pr-7 py-1.5 bg-studio-sidebar/50 hover:bg-studio-sidebar/80 focus:bg-white border border-studio-border focus:border-brand-orange rounded-lg text-[12px] text-studio-text placeholder:text-studio-muted/70 focus:outline-none transition-all shadow-2xs"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-studio-muted hover:text-studio-text rounded cursor-pointer"
          title="Clear search"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
