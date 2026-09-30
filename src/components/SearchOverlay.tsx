import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, Star, ArrowRight, Loader2 } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelectMovie,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSuggestions([]);
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounced Autocomplete
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=5`);
        if (res.ok) {
          const list = await res.json();
          setSuggestions(list);
        }
      } catch (err) {
        console.error('Autocomplete fetch error:', err);
      }
    }, 200);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  if (!isOpen) return null;

  const handleFullSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSuggestions([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=24`);
      if (res.ok) {
        const list = await res.json();
        setSearchResults(list);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (movie: Movie) => {
    onSelectMovie(movie);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col">
        {/* Search Header Row */}
        <div className="flex items-center justify-between gap-4 mb-4 pt-2">
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
            Global Movie Search
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFullSearch} className="relative mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, actors, titles across Indian, Hollywood & International cinema..."
              className="w-full bg-[#111724] border border-slate-800 focus:border-amber-500 rounded-xl py-3.5 pl-12 pr-28 text-white placeholder-slate-500 text-sm sm:text-base outline-none transition-all shadow-xl focus:ring-2 focus:ring-amber-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                }}
                className="absolute right-20 text-slate-500 hover:text-slate-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Autocomplete Dropdown List */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#111724] border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-20 divide-y divide-slate-800/60">
              {suggestions.map((m) => (
                <div
                  key={`suggestion-${m.id}`}
                  onClick={() => handleSelect(m)}
                  className="p-3 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between gap-3 text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-13 rounded bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {m.poster_url ? (
                        <img
                          src={m.poster_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Film className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {m.title}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {m.year} &bull; {m.genre} &bull; {m.cinema || m.language}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded shrink-0">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{m.rating > 0 ? m.rating.toFixed(1) : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-medium text-slate-300">Searching global movie database...</p>
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Film className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-200">No movies found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No matching titles found for "{query}". Try checking the spelling or search by title or actor name.
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            <div>
              <div className="text-xs text-slate-400 mb-4 font-mono">
                Found {searchResults.length} results for "{query}"
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((m) => (
                  <MovieCard key={`search-${m.id}`} movie={m} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              <p className="mb-2">Search covers 1930s classics, modern blockbusters, Indian and International cinema.</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-slate-600">Try searching:</span>
                {['RRR', 'Inception', 'Parasite', 'Sholay', 'Spirited Away', 'The Godfather', 'Vikram', 'Oppenheimer'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setQuery(t);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
