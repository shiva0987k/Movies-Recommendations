import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Sparkles, TrendingUp, Star, Clock, Compass, Layers } from 'lucide-react';
import { Movie, UserPreferences } from '../types';
import { MovieCard } from '../components/MovieCard';
import { usePreferences } from '../context/PreferencesContext';

interface HomePageProps {
  preferences?: UserPreferences;
  onOpenPreferences?: () => void;
  onSelectMovie: (movie: Movie) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  preferences: propPreferences,
  onOpenPreferences: propOpenPreferences,
  onSelectMovie,
}) => {
  const { preferences: contextPreferences, openOnboarding } = usePreferences();
  const preferences = propPreferences || contextPreferences;
  const onOpenPreferences = propOpenPreferences || openOnboarding;

  const [recommendedPicks, setRecommendedPicks] = useState<Movie[]>([]);
  const [popularPicks, setPopularPicks] = useState<Movie[]>([]);
  const [topRatedPicks, setTopRatedPicks] = useState<Movie[]>([]);
  const [classicsPicks, setClassicsPicks] = useState<Movie[]>([]);
  const [hiddenGems, setHiddenGems] = useState<Movie[]>([]);
  const [recentlyReleased, setRecentlyReleased] = useState<Movie[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPersonalizedSections();
  }, [preferences]);

  const fetchPersonalizedSections = async () => {
    setIsLoading(true);
    const genreParam = preferences.moodGenres.join(',');
    const langParam = preferences.cinemas.join(',');
    const eraParam = preferences.eras && preferences.eras.length > 0 ? preferences.eras.join(',') : (preferences.era || 'any');
    const ratingParam = preferences.minRating;

    try {
      // 1. Recommended For You (Preferences aligned)
      const recPromise = fetch(
        `/api/discover?genres=${genreParam}&languages=${langParam}&era=${eraParam}&min_rating=${ratingParam}&experience=popular&limit=8`
      ).then(r => r.json());

      // 2. Highly Rated in selection
      const topRatedPromise = fetch(
        `/api/discover?genres=${genreParam}&languages=${langParam}&era=${eraParam}&min_rating=${ratingParam > 0 ? ratingParam : 7}&experience=highly_rated&limit=8`
      ).then(r => r.json());

      // 3. Popular
      const popularPromise = fetch(
        `/api/discover?languages=${langParam}&experience=popular&limit=8`
      ).then(r => r.json());

      // 4. Hidden Gems
      const gemsPromise = fetch(
        `/api/discover?genres=${genreParam}&languages=${langParam}&experience=hidden_gems&limit=8`
      ).then(r => r.json());

      // 5. Classics (1930s-1980s or user selected era)
      const classicEra = ['1930s', '1940s', '1950s', '1960s', '1970s', '1980s'].some(e => eraParam.includes(e))
        ? eraParam
        : 'classics';
      const classicsPromise = fetch(
        `/api/discover?genres=${genreParam}&experience=classics&era=${classicEra}&limit=8`
      ).then(r => r.json());

      // 6. Recently Released
      const recentPromise = fetch(
        `/api/discover?genres=${genreParam}&languages=${langParam}&experience=recent&limit=8`
      ).then(r => r.json());

      const [recData, topData, popData, gemsData, classData, recentsData] = await Promise.all([
        recPromise,
        topRatedPromise,
        popularPromise,
        gemsPromise,
        classicsPromise,
        recentPromise,
      ]);

      setRecommendedPicks(recData.results || []);
      setTopRatedPicks(topData.results || []);
      setPopularPicks(popData.results || []);
      setHiddenGems(gemsData.results || []);
      setClassicsPicks(classData.results || []);
      setRecentlyReleased(recentsData.results || []);
    } catch (err) {
      console.error('Failed to load personalized sections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPreferences = preferences.hasCompletedOnboarding;

  return (
    <div className="space-y-12">
      {/* Personalized Welcome Banner */}
      <section className="bg-gradient-to-r from-[#111726] to-[#0c111d] border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalized Discovery</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            YOUR MOVIE PICKS
          </h1>

          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Based on what you selected. Explore curated recommendations, click any title to view complete metadata, and compute content-based similarities.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
            <span className="text-slate-500">Active taste profile:</span>
            <span className="text-slate-200 font-medium">
              {preferences.cinemas.includes('any') ? 'Worldwide Cinema' : `${preferences.cinemas.length} Cinema(s)`}
            </span>
            <span aria-hidden="true" className="text-slate-600">&bull;</span>
            <span className="text-slate-200 font-medium">
              Era: {preferences.eras && preferences.eras.length > 0 ? (preferences.eras.includes('any') ? 'ALL ERAS' : preferences.eras.join(', ').toUpperCase()) : (preferences.era || 'ANY').toUpperCase()}
            </span>
            <span aria-hidden="true" className="text-slate-600">&bull;</span>
            <span className="text-slate-200 font-medium">
              Rating: {preferences.minRating > 0 ? `IMDb ${preferences.minRating}+` : 'Any'}
            </span>

            <button
              onClick={() => onOpenPreferences()}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Refine Taste</span>
            </button>
          </div>
        </div>
      </section>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="space-y-10 py-6">
          <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Finding movies for you based on your taste profile...</span>
          </div>
          {[1, 2].map((s) => (
            <div key={s} className="space-y-4">
              <div className="h-6 w-48 bg-slate-800/60 rounded animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((c) => (
                  <div key={c} className="aspect-[2/3] bg-slate-800/40 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Section 1: Recommended For You */}
          {recommendedPicks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Recommended For You</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Curated matches tailored to your selected mood and cinema interests
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                {recommendedPicks.map((m) => (
                  <MovieCard key={`rec-${m.id}`} movie={m} onSelect={onSelectMovie} />
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Highly Rated Picks */}
          {topRatedPicks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span>Highly Rated Picks</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Acclaimed titles with outstanding audience evaluations
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                {topRatedPicks.map((m) => (
                  <MovieCard key={`top-${m.id}`} movie={m} onSelect={onSelectMovie} />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Popular In Your Selection */}
          {popularPicks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>Popular In Your Selection</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trending feature films with global audience interest
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                {popularPicks.map((m) => (
                  <MovieCard key={`pop-${m.id}`} movie={m} onSelect={onSelectMovie} />
                ))}
              </div>
            </section>
          )}

          {/* Section 4: Hidden Gems */}
          {hiddenGems.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Hidden Gems</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    High rating (7.5+) masterpieces that fly beneath mainstream radars
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                {hiddenGems.map((m) => (
                  <MovieCard key={`gem-${m.id}`} movie={m} onSelect={onSelectMovie} />
                ))}
              </div>
            </section>
          )}

          {/* Section 5: Classic Picks (1930s-1980s) */}
          {classicsPicks.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Classic Picks</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Timeless heritage and vintage cinematic masterworks from the golden eras
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                {classicsPicks.map((m) => (
                  <MovieCard key={`classic-${m.id}`} movie={m} onSelect={onSelectMovie} />
                ))}
              </div>
            </section>
          )}

          {/* Section 6: Recently Released */}
          {recentlyReleased.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Recently Released</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fresh cinematic releases across languages and industries
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                {recentlyReleased.map((m) => (
                  <MovieCard key={`recent-${m.id}`} movie={m} onSelect={onSelectMovie} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
