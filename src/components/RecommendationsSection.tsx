import React from 'react';
import { Sparkles, Cpu, Film } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface RecommendationsSectionProps {
  selectedMovie: Movie | null;
  recommendations: Movie[];
  isLoading: boolean;
  onSelectMovie: (movie: Movie) => void;
  onClose: () => void;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  selectedMovie,
  recommendations,
  isLoading,
  onSelectMovie,
  onClose,
}) => {
  if (!selectedMovie && !isLoading) return null;

  return (
    <section className="mb-14 scroll-mt-24 p-6 sm:p-8 rounded-2xl bg-[#0d1320] border border-amber-500/20 shadow-2xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>TF-IDF &bull; Cosine Similarity Machine Learning Engine</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            YOU MAY ALSO LIKE
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Recommended based on similar genres, themes, cast, and movie storyline for{' '}
            <span className="text-amber-400 font-semibold">"{selectedMovie?.title}"</span>.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
        >
          Dismiss Recommendations
        </button>
      </div>

      {/* Loading Skeletons */}
      {isLoading ? (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <h4 className="text-sm font-semibold text-white">
            Finding movies you may like...
          </h4>
          <p className="text-xs text-slate-400 max-w-md">
            Transforming natural language plot overviews, keywords, genres, and directors into mathematical feature vectors.
          </p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs">
          No close cosine matches found in catalog for this title.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
          {recommendations.map((movie) => (
            <MovieCard
              key={`${movie.id}-${movie.title}`}
              movie={movie}
              onSelect={onSelectMovie}
              showSimilarity
            />
          ))}
        </div>
      )}
    </section>
  );
};
