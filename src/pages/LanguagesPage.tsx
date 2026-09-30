import React, { useState, useEffect } from 'react';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';
import { Movie } from '../types';
import { MovieCard } from '../components/MovieCard';

interface LanguagesPageProps {
  onSelectMovie: (movie: Movie) => void;
  onNavigateToDiscoverWithLanguage: (langCode: string) => void;
}

const INDIAN_CINEMAS = [
  { code: 'hi', name: 'Hindi', cinema: 'Bollywood', flag: '🇮🇳', desc: 'Mainstream Hindi cinematic epics, romantic classics, thrillers, and parallel cinema' },
  { code: 'te', name: 'Telugu', cinema: 'Tollywood', flag: '🇮🇳', desc: 'Grand scale mythologies, action spectacles, mass blockbusters, and historic epics (e.g. RRR, Baahubali)' },
  { code: 'ta', name: 'Tamil', cinema: 'Kollywood', flag: '🇮🇳', desc: 'Stylistic action noirs, socio-political drama, experimental cinema, and cutting-edge craft' },
  { code: 'ml', name: 'Malayalam', cinema: 'Mollywood', flag: '🇮🇳', desc: 'Realistic character-driven storytelling, nuanced slice-of-life scripts, and critical acclaimed masterworks' },
  { code: 'kn', name: 'Kannada', cinema: 'Sandalwood', flag: '🇮🇳', desc: 'High-concept cinematic thrillers, indigenous historical dramas, and pan-Indian sensations' },
  { code: 'bn', name: 'Bengali', cinema: 'Bengali Cinema', flag: '🇮🇳', desc: 'Rich heritage of parallel cinema, literary adaptations, and artistic masterpieces' },
  { code: 'mr', name: 'Marathi', cinema: 'Marathi Cinema', flag: '🇮🇳', desc: 'Rooted social narratives, contemporary satire, and poignant human stories' },
  { code: 'pa', name: 'Punjabi', cinema: 'Pollywood', flag: '🇮🇳', desc: 'Hearty comedies, historical valor epics, music-infused romance, and cultural journeys' },
  { code: 'gu', name: 'Gujarati', cinema: 'Gujarati Cinema', flag: '🇮🇳', desc: 'Urban comedy, rural cultural folktales, and vibrant dramatic narratives' },
];

const INTERNATIONAL_CINEMAS = [
  { code: 'en', name: 'English', cinema: 'Hollywood & International', flag: '🇺🇸', desc: 'Global blockbuster productions, indie festival favorites, and universal classics' },
  { code: 'ko', name: 'Korean', cinema: 'Korean Cinema (Hallyu)', flag: '🇰🇷', desc: 'High-tension thrillers, razor-sharp social satire (Parasite), and emotional epics' },
  { code: 'ja', name: 'Japanese', cinema: 'Japanese Cinema & Anime', flag: '🇯🇵', desc: 'Visionary animation (Studio Ghibli), samurai heritage, and quiet introspective dramas' },
  { code: 'zh', name: 'Chinese', cinema: 'Chinese Cinema', flag: '🇨🇳', desc: 'Wuxia martial arts, grand historical dynasties, and poetic auteur films' },
  { code: 'fr', name: 'French', cinema: 'French Cinema', flag: '🇫🇷', desc: 'New Wave heritage, sophisticated philosophical comedy, romance, and psychological art' },
  { code: 'es', name: 'Spanish', cinema: 'Spanish & Latin Cinema', flag: '🇪🇸', desc: 'Vibrant magical realism, tense suspense thrillers, and passionate character studies' },
  { code: 'de', name: 'German', cinema: 'German Cinema', flag: '🇩🇪', desc: 'Expressionist roots, intense historical chronicles, and dark psychological realism' },
  { code: 'it', name: 'Italian', cinema: 'Italian Cinema', flag: '🇮🇹', desc: 'Neorealist milestones, cinematic romance, pasta westerns, and operatic dramas' },
];

export const LanguagesPage: React.FC<LanguagesPageProps> = ({
  onSelectMovie,
  onNavigateToDiscoverWithLanguage,
}) => {
  const [activeCode, setActiveCode] = useState<string>('te');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLanguageMovies(activeCode);
  }, [activeCode]);

  const fetchLanguageMovies = async (code: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/discover?languages=${code}&experience=popular&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setMovies(data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch cinema movies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const allCinemas = [...INDIAN_CINEMAS, ...INTERNATIONAL_CINEMAS];
  const activeCinema = allCinemas.find((c) => c.code === activeCode) || INDIAN_CINEMAS[0];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Browse by Cinema & Language
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore movies across the diverse regional film industries of India and leading international cinematic traditions.
        </p>
      </div>

      {/* Indian Cinema Section */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-3 flex items-center gap-1.5">
          <span>🇮🇳</span>
          <span>Indian Regional Cinema</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {INDIAN_CINEMAS.map((c) => {
            const isSelected = activeCode === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setActiveCode(c.code)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-[#111724] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white mb-0.5">
                  <span>{c.name}</span>
                  <span>{c.flag}</span>
                </div>
                <span className="text-[11px] text-slate-400 truncate">{c.cinema}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* International Cinema Section */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-cyan-400 font-bold mb-3 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          <span>International World Cinema</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {INTERNATIONAL_CINEMAS.map((c) => {
            const isSelected = activeCode === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setActiveCode(c.code)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                    : 'bg-[#111724] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white mb-0.5">
                  <span>{c.name}</span>
                  <span>{c.flag}</span>
                </div>
                <span className="text-[11px] text-slate-400 truncate">{c.cinema}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Cinema Movies Showcase */}
      <div className="pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{activeCinema.flag}</span>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {activeCinema.name} &bull; {activeCinema.cinema}
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              {activeCinema.desc}
            </p>
          </div>

          <button
            onClick={() => onNavigateToDiscoverWithLanguage(activeCinema.code)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Explore all in Discover</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real Movies Grid */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm font-medium text-slate-300">Loading {activeCinema.cinema} titles...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            No movies currently found for this industry.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map((m) => (
              <MovieCard key={`lang-m-${m.id}`} movie={m} onSelect={onSelectMovie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
