import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, Loader2, RotateCcw } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from '../components/MovieCard';

interface DiscoverPageProps {
  onSelectMovie: (movie: Movie) => void;
  initialGenre?: string;
  initialLanguage?: string;
}

const GENRE_OPTIONS = [
  { id: 'all', label: 'All Genres' },
  { id: '28', label: 'Action' },
  { id: '12', label: 'Adventure' },
  { id: '16', label: 'Animation' },
  { id: '35', label: 'Comedy' },
  { id: '80', label: 'Crime' },
  { id: '99', label: 'Documentary' },
  { id: '18', label: 'Drama' },
  { id: '10751', label: 'Family' },
  { id: '14', label: 'Fantasy' },
  { id: '27', label: 'Horror' },
  { id: '9648', label: 'Mystery' },
  { id: '10749', label: 'Romance' },
  { id: '878', label: 'Science Fiction' },
  { id: '53', label: 'Thriller' },
  { id: '10752', label: 'War' },
  { id: '37', label: 'Western' },
  { id: '10402', label: 'Musical' },
];

const LANGUAGE_OPTIONS = [
  { id: 'all', label: 'All Cinemas & Languages' },
  // Indian Cinema
  { id: 'hi', label: '🇮🇳 Hindi (Bollywood)' },
  { id: 'te', label: '🇮🇳 Telugu (Tollywood)' },
  { id: 'ta', label: '🇮🇳 Tamil (Kollywood)' },
  { id: 'ml', label: '🇮🇳 Malayalam (Mollywood)' },
  { id: 'kn', label: '🇮🇳 Kannada (Sandalwood)' },
  { id: 'bn', label: '🇮🇳 Bengali Cinema' },
  { id: 'mr', label: '🇮🇳 Marathi Cinema' },
  { id: 'pa', label: '🇮🇳 Punjabi Cinema' },
  { id: 'gu', label: '🇮🇳 Gujarati Cinema' },
  // International
  { id: 'en', label: '🇺🇸 English (Hollywood & Global)' },
  { id: 'ko', label: '🇰🇷 Korean Cinema' },
  { id: 'ja', label: '🇯🇵 Japanese Cinema & Anime' },
  { id: 'zh', label: '🇨🇳 Chinese Cinema' },
  { id: 'fr', label: '🇫🇷 French Cinema' },
  { id: 'es', label: '🇪🇸 Spanish & Latin Cinema' },
  { id: 'de', label: '🇩🇪 German Cinema' },
  { id: 'it', label: '🇮🇹 Italian Cinema' },
];

const ERA_OPTIONS = [
  { id: 'any', label: 'Any Era' },
  { id: '2020s', label: '2020s (Contemporary)' },
  { id: '2010s', label: '2010s' },
  { id: '2000s', label: '2000s' },
  { id: '1990s', label: '1990s' },
  { id: '1980s', label: '1980s' },
  { id: '1970s', label: '1970s' },
  { id: '1960s', label: '1960s' },
  { id: '1950s', label: '1950s' },
  { id: '1940s', label: '1940s' },
  { id: '1930s', label: '1930s' },
];

const SORT_OPTIONS = [
  { id: 'popularity.desc', label: 'Most Popular' },
  { id: 'vote_average.desc', label: 'Highest Rated' },
  { id: 'primary_release_date.desc', label: 'Newest First' },
  { id: 'revenue.desc', label: 'Box Office Hits' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any Rating' },
  { value: 6, label: '6.0+' },
  { value: 7, label: '7.0+' },
  { value: 8, label: '8.0+' },
  { value: 8.5, label: '8.5+ (Masterpieces)' },
];

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  onSelectMovie,
  initialGenre,
  initialLanguage,
}) => {
  const [genre, setGenre] = useState(initialGenre || 'all');
  const [language, setLanguage] = useState(initialLanguage || 'all');
  const [era, setEra] = useState('any');
  const [rating, setRating] = useState(0);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [page, setPage] = useState(1);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Sync prop changes
  useEffect(() => {
    if (initialGenre) setGenre(initialGenre);
  }, [initialGenre]);

  useEffect(() => {
    if (initialLanguage) setLanguage(initialLanguage);
  }, [initialLanguage]);

  // Fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchMovies(1);
  }, [genre, language, era, rating, sortBy]);

  const fetchMovies = async (targetPage: number) => {
    setIsLoading(true);
    const params = new URLSearchParams({
      genres: genre !== 'all' ? genre : '',
      languages: language !== 'all' ? language : '',
      era,
      min_rating: rating > 0 ? String(rating) : '0',
      sort_by: sortBy,
      page: String(targetPage),
    });

    try {
      const res = await fetch(`/api/discover?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMovies(data.results || []);
        setTotalPages(Math.min(data.total_pages || 1, 50));
      }
    } catch (err) {
      console.error('Discover fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchMovies(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setGenre('all');
    setLanguage('all');
    setEra('any');
    setRating(0);
    setSortBy('popularity.desc');
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Filter Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Discover & Filter Movies
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Explore global cinema across all eras (1930s–2020s), regional Indian industries, and international cinema.
            </p>
          </div>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-white transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-4 rounded-xl bg-[#111724] border border-slate-800">
          {/* Genre Filter */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {GENRE_OPTIONS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cinema / Language Filter */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Cinema & Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Era Filter */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Era / Decade
            </label>
            <select
              value={era}
              onChange={(e) => setEra(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {ERA_OPTIONS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Min Rating
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {RATING_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Searching global catalog...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-[#111724] border border-slate-800 rounded-2xl">
          <p className="text-base font-semibold text-slate-200">No movies match these filters</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your era, cinema, or minimum rating threshold.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {movies.map((m) => (
            <MovieCard key={`disc-${m.id}`} movie={m} onSelect={onSelectMovie} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {movies.length > 0 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-slate-800">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            &larr; Previous Page
          </button>

          <span className="text-xs text-slate-400 font-mono">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            Next Page &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
