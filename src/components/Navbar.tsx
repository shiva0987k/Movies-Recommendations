import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenPreferences: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenSearch,
  onOpenPreferences,
}) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'discover', label: 'Discover' },
    { id: 'genres', label: 'Genres' },
    { id: 'languages', label: 'Languages' },
    { id: 'preferences', label: 'My Preferences' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single Text Element Brand Wordmark */}
        <button
          onClick={() => onTabChange('home')}
          className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap text-left cursor-pointer"
        >
          CINEMATCH
        </button>

        {/* Zone 2: 4–6 Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-amber-400 font-semibold' : 'hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Global Search"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search movies...</span>
          </button>

          <button
            onClick={onOpenPreferences}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Update Preferences"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Strip */}
      <div className="md:hidden flex items-center gap-4 px-4 py-2 border-t border-slate-800/80 overflow-x-auto text-xs text-slate-400 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`whitespace-nowrap transition-colors ${
              currentTab === item.id ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
