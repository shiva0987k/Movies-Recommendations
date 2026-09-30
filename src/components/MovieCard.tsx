import React, { useState } from 'react';
import { Film, Star, ArrowUpRight } from 'lucide-react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  showSimilarity?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect, showSimilarity = false }) => {
  const [imageError, setImageError] = useState(false);

  // Format primary genres
  const displayGenres = (movie.genre || '')
    .split(',')
    .map(g => g.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' • ');

  const hasPoster = movie.poster_url && !imageError;
  const hasRealImdb = movie.imdb_rating !== null && movie.imdb_rating !== undefined && movie.imdb_rating > 0;

  return (
    <div
      onClick={() => onSelect(movie)}
      className="group relative bg-[#111724] border border-slate-800/90 hover:border-amber-500/50 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/70 cursor-pointer"
    >
      {/* Poster Media Box with Strict 2:3 Aspect Ratio & Subtle Zoom */}
      <div className="aspect-[2/3] w-full bg-[#0d121c] relative overflow-hidden flex items-center justify-center">
        {hasPoster ? (
          <img
            src={movie.poster_url!}
            alt={movie.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-900 to-[#0a0e17] text-slate-400">
            <Film className="w-9 h-9 text-amber-500/60 mb-2 stroke-[1.5]" />
            <span className="text-xs font-semibold text-slate-300 line-clamp-2 px-1 mb-1">
              {movie.title}
            </span>
            <span className="text-[10px] tracking-wider text-slate-400 uppercase font-mono">
              POSTER UNAVAILABLE
            </span>
          </div>
        )}

        {/* Content-Based Cosine Similarity Badge */}
        {showSimilarity && movie.similarity_pct !== undefined && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded shadow-md tracking-tight">
            {movie.similarity_pct}% MATCH
          </div>
        )}

        {/* Hover Quick Overlay with View Details */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center">
          <span className="text-xs font-semibold text-white bg-slate-900/95 border border-slate-700 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xl">
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </span>
          {movie.cinema && (
            <span className="text-[11px] text-amber-300 mt-2 font-medium drop-shadow">
              {movie.cinema}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug"
            title={movie.title}
          >
            {movie.title}
          </h3>

          {/* Clearly Labeled IMDb Rating Section */}
          <div className="mt-1.5 flex items-center justify-between gap-1 text-xs">
            {hasRealImdb ? (
              <div className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>★ {movie.imdb_rating!.toFixed(1)}/10</span>
                <span className="text-[10px] uppercase font-bold text-amber-500/90 tracking-wider ml-0.5 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                  IMDb
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 font-medium">
                IMDb rating unavailable
              </div>
            )}

            {/* Optional quiet secondary TMDB note if IMDb unavailable */}
            {!hasRealImdb && movie.rating > 0 && (
              <span className="text-[10px] text-slate-400">
                TMDB {movie.rating.toFixed(1)}★
              </span>
            )}
          </div>
        </div>

        {/* Clean Unboxed Metadata with · separator */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span>{movie.year || 'N/A'}</span>
            {displayGenres && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="truncate max-w-[130px]">{displayGenres}</span>
              </>
            )}
          </div>

          <span className="text-[11px] text-slate-400 truncate shrink-0 ml-1">
            {movie.language ? movie.language.toUpperCase() : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
