import React, { useState, useEffect } from 'react';
import { X, Star, Clock, Globe, Sparkles, Film, User, Tag } from 'lucide-react';
import { Movie } from '../types';

interface MovieDetailsModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onGetRecommendations: (movie: Movie) => void;
  isLoadingRecommendations?: boolean;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  isOpen,
  onClose,
  onGetRecommendations,
  isLoadingRecommendations = false,
}) => {
  const [details, setDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [posterError, setPosterError] = useState(false);

  useEffect(() => {
    if (movie && isOpen) {
      setPosterError(false);
      fetchFullDetails(movie.id);
    } else {
      setDetails(null);
    }
  }, [movie, isOpen]);

  const fetchFullDetails = async (id: number) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/movie/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
      } else {
        setDetails(movie);
      }
    } catch {
      setDetails(movie);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!isOpen || !movie) return null;

  const activeMovie = details || movie;
  const backdropUrl = activeMovie.backdrop_url;
  const posterUrl = activeMovie.poster_url;
  const hasPoster = posterUrl && !posterError;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#0e1422] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Backdrop Banner Header with Scrim */}
        <div className="relative aspect-[16/7] w-full bg-slate-900 overflow-hidden">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-950 via-[#131b2e] to-slate-950" />
          )}

          {/* Measured Gradient Scrim for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1422] via-[#0e1422]/60 to-black/30" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-colors border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="px-6 pb-6 pt-0 relative -mt-20 sm:-mt-28">
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr] gap-6">
            {/* Poster Card */}
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[#111724] border-2 border-slate-800/90 shadow-2xl relative shrink-0">
              {hasPoster ? (
                <img
                  src={posterUrl}
                  alt={activeMovie.title}
                  referrerPolicy="no-referrer"
                  onError={() => setPosterError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-slate-900 text-slate-400">
                  <Film className="w-10 h-10 text-amber-500/60 mb-2" />
                  <span className="text-xs font-semibold text-white px-1 mb-1">
                    {activeMovie.title}
                  </span>
                  <span className="text-[10px] tracking-wider text-slate-400 uppercase font-mono">
                    POSTER UNAVAILABLE
                  </span>
                </div>
              )}
            </div>

            {/* Movie Information Column */}
            <div className="flex flex-col justify-end pt-4 sm:pt-14">
              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {activeMovie.title}
                </h2>
                {activeMovie.year && (
                  <span className="text-base text-slate-400 font-medium">
                    ({activeMovie.year})
                  </span>
                )}
              </div>

              {/* Original Title (if different) */}
              {activeMovie.original_title && activeMovie.original_title !== activeMovie.title && (
                <div className="text-xs text-slate-400 mb-2 italic">
                  Original Title: {activeMovie.original_title}
                </div>
              )}

              {/* Tagline */}
              {activeMovie.tagline && (
                <p className="text-xs text-amber-400/90 italic mb-3">
                  "{activeMovie.tagline}"
                </p>
              )}

              {/* Clearly Labeled Ratings & Source Identification */}
              <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                {/* Real IMDb Rating Box */}
                {activeMovie.imdb_rating ? (
                  <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 rounded-lg text-amber-400 font-bold text-xs">
                    <span className="text-[10px] tracking-wider uppercase font-mono px-1 py-0.2 bg-amber-500 text-slate-950 rounded font-black">
                      IMDb
                    </span>
                    <span>★ {activeMovie.imdb_rating.toFixed(1)} / 10</span>
                    {activeMovie.imdb_votes && (
                      <span className="text-slate-400 font-normal text-[10px]">
                        ({activeMovie.imdb_votes} votes)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                    IMDb rating unavailable
                  </div>
                )}

                {/* Secondary TMDB Rating (Clearly separated & labeled) */}
                {activeMovie.tmdb_rating && (
                  <div className="text-xs text-slate-300 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg">
                    <span className="text-slate-500 font-mono text-[10px] uppercase mr-1">TMDB</span>
                    <span className="font-semibold text-slate-200">{activeMovie.tmdb_rating.toFixed(1)}</span>
                    <span className="text-slate-500 text-[10px]">/10</span>
                  </div>
                )}

                {activeMovie.runtime > 0 && (
                  <div className="flex items-center gap-1 text-slate-400 text-xs ml-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activeMovie.runtime} min</span>
                  </div>
                )}

                {activeMovie.cinema && (
                  <div className="flex items-center gap-1 text-slate-400 text-xs ml-1">
                    <Globe className="w-3 h-3" />
                    <span>{activeMovie.cinema}</span>
                  </div>
                )}
              </div>

              {/* Primary Call to Action: Get Recommendations */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => onGetRecommendations(activeMovie)}
                  disabled={isLoadingRecommendations}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-lg hover:shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>
                    {isLoadingRecommendations ? 'Calculating Recommendations...' : 'Get Recommendations'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Overview & Credits Section */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-xs sm:text-sm space-y-4">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                Overview
              </h4>
              <p className="text-slate-300 leading-relaxed">
                {activeMovie.overview || 'No overview provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {activeMovie.director && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                    Director
                  </span>
                  <span className="text-slate-200 font-medium">
                    {activeMovie.director}
                  </span>
                </div>
              )}

              {activeMovie.cast && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                    Main Cast
                  </span>
                  <span className="text-slate-200 font-medium">
                    {activeMovie.cast}
                  </span>
                </div>
              )}

              {activeMovie.country && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                    Country
                  </span>
                  <span className="text-slate-200">
                    {activeMovie.country}
                  </span>
                </div>
              )}

              {activeMovie.release_date && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                    Full Release Date
                  </span>
                  <span className="text-slate-200">
                    {activeMovie.release_date}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
