import React, { useState, useEffect } from 'react';
import { Film, ArrowRight, Loader2 } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from '../components/MovieCard';

interface GenresPageProps {
  onSelectMovie: (movie: Movie) => void;
  onNavigateToDiscoverWithGenre: (genreId: string) => void;
}

const GENRE_CARDS = [
  { id: '28', name: 'Action', emoji: '🎬', desc: 'Explosive high-stakes stunts, kinetic choreography, and adrenaline' },
  { id: '12', name: 'Adventure', emoji: '🗺️', desc: 'Epic quests, expeditions, uncharted territories, and discovery' },
  { id: '16', name: 'Animation', emoji: '💫', desc: 'Artistic animated features, anime, hand-drawn and digital visual art' },
  { id: '35', name: 'Comedy', emoji: '😂', desc: 'Witty satire, laugh-out-loud humor, slapstick, and comedic narratives' },
  { id: '80', name: 'Crime', emoji: '🕵️', desc: 'Underworld syndicates, heist drama, investigations, and detectives' },
  { id: '99', name: 'Documentary', emoji: '🎞️', desc: 'Real-world exposés, nature chronicles, and biographical documentaries' },
  { id: '18', name: 'Drama', emoji: '🎭', desc: 'Character-driven human drama, powerful conflicts, and emotion' },
  { id: '10751', name: 'Family', emoji: '👨‍👩‍👧', desc: 'Heartwarming, engaging entertainment suitable for all generations' },
  { id: '14', name: 'Fantasy', emoji: '🧙', desc: 'Mythical realms, ancient sorcery, legendary creatures, and folklore' },
  { id: '27', name: 'Horror', emoji: '😱', desc: 'Psychological terror, supernatural frights, creature features, and suspense' },
  { id: '9648', name: 'Mystery', emoji: '🔍', desc: 'Complex enigmas, whodunits, puzzle-box plots, and hidden secrets' },
  { id: '10749', name: 'Romance', emoji: '❤️', desc: 'Passionate connections, intimate chemistry, and timeless love stories' },
  { id: '878', name: 'Science Fiction', emoji: '🚀', desc: 'Futuristic technology, space odysseys, multiverse theory, and AI' },
  { id: '53', name: 'Thriller', emoji: '🔥', desc: 'Edge-of-your-seat suspense, tension, psychological twists, and danger' },
  { id: '10752', name: 'War', emoji: '⚔️', desc: 'Historical military conflicts, battlefield courage, and human resilience' },
  { id: '37', name: 'Western', emoji: '🤠', desc: 'Frontier justice, lone gunslingers, outlaws, and desert vistas' },
  { id: '10402', name: 'Musical', emoji: '🎵', desc: 'Showtunes, vibrant choreography, score-driven narratives, and rhythm' },
];

export const GenresPage: React.FC<GenresPageProps> = ({
  onSelectMovie,
  onNavigateToDiscoverWithGenre,
}) => {
  const [activeGenreId, setActiveGenreId] = useState<string>('28');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchGenreMovies(activeGenreId);
  }, [activeGenreId]);

  const fetchGenreMovies = async (gid: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/discover?genres=${gid}&experience=popular&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setMovies(data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch genre movies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeGenre = GENRE_CARDS.find((g) => g.id === activeGenreId) || GENRE_CARDS[0];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Browse by Genre
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore movies curated across 17 major film genres. Click any category to view popular titles and discover new stories.
        </p>
      </div>

      {/* Genre Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {GENRE_CARDS.map((g) => {
          const isSelected = activeGenreId === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGenreId(g.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-[#111724] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="text-2xl mb-1">{g.emoji}</span>
              <span className="text-xs font-semibold truncate text-white">{g.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Genre Showcase */}
      <div className="pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{activeGenre.emoji}</span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {activeGenre.name} Movies
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              {activeGenre.desc}
            </p>
          </div>

          <button
            onClick={() => onNavigateToDiscoverWithGenre(activeGenre.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Explore all {activeGenre.name} in Discover</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real Movies Grid */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Loading {activeGenre.name} catalog...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            No movies currently found for this genre.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map((m) => (
              <MovieCard key={`genre-m-${m.id}`} movie={m} onSelect={onSelectMovie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
