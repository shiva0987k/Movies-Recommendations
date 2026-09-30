import React from 'react';
import { SlidersHorizontal, RotateCcw, Check, Sparkles } from 'lucide-react';
import { UserPreferences } from '../types';
import { usePreferences } from '../context/PreferencesContext';

interface PreferencesPageProps {
  preferences?: UserPreferences;
  onOpenOnboarding?: () => void;
  onResetPreferences?: () => void;
}

const GENRE_LABELS: Record<string, string> = {
  '28': 'Action',
  '35': 'Comedy',
  '10749': 'Romance',
  '27': 'Horror',
  '9648': 'Mystery',
  '53': 'Thriller',
  '18': 'Drama',
  '14': 'Fantasy',
  '878': 'Science Fiction',
  '12': 'Adventure',
  '10751': 'Family',
  '80': 'Crime',
  '99': 'Documentary',
  '10752': 'War',
  '37': 'Western',
  '10402': 'Musical',
  '16': 'Animation',
};

const CINEMA_LABELS: Record<string, string> = {
  any: '🌎 Any Cinema Worldwide',
  hi: '🇮🇳 Hindi (Bollywood)',
  te: '🇮🇳 Telugu (Tollywood)',
  ta: '🇮🇳 Tamil (Kollywood)',
  ml: '🇮🇳 Malayalam (Mollywood)',
  kn: '🇮🇳 Kannada (Sandalwood)',
  bn: '🇮🇳 Bengali Cinema',
  mr: '🇮🇳 Marathi Cinema',
  pa: '🇮🇳 Punjabi Cinema',
  gu: '🇮🇳 Gujarati Cinema',
  en: '🇺🇸 English (Hollywood)',
  ko: '🇰🇷 Korean Cinema',
  ja: '🇯🇵 Japanese Cinema & Anime',
  zh: '🇨🇳 Chinese Cinema',
  fr: '🇫🇷 French Cinema',
  es: '🇪🇸 Spanish & Latin Cinema',
  de: '🇩🇪 German Cinema',
  it: '🇮🇹 Italian Cinema',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  popular: 'Popular / Trending',
  highly_rated: 'Highly Rated',
  recent: 'Recent Releases',
  classics: 'Classics',
  hidden_gems: 'Hidden Gems',
  family: 'Family Friendly',
  acclaimed: 'Critically Acclaimed',
  character_driven: 'Character Driven',
  big_entertainment: 'Big Entertainment',
};

export const PreferencesPage: React.FC<PreferencesPageProps> = ({
  preferences: propPreferences,
  onOpenOnboarding: propOpenOnboarding,
  onResetPreferences: propResetPreferences,
}) => {
  const { preferences: contextPreferences, openOnboarding, resetPreferences } = usePreferences();
  const preferences = propPreferences || contextPreferences;
  const onOpenOnboarding = propOpenOnboarding || openOnboarding;
  const onResetPreferences = propResetPreferences || resetPreferences;
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Taste Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Your saved discovery profile stored locally. These choices guide the personalized discovery sections on Home.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onResetPreferences()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => onOpenOnboarding()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Edit Preferences</span>
          </button>
        </div>
      </div>

      {/* Preferences Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mood & Genres */}
        <div className="p-5 rounded-xl bg-[#111724] border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block mb-2">
            Selected Moods & Genres
          </span>
          <div className="flex flex-wrap gap-1.5">
            {preferences.moodGenres.map((g) => (
              <span
                key={g}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-200"
              >
                {GENRE_LABELS[g] || g}
              </span>
            ))}
          </div>
        </div>

        {/* Cinemas & Languages */}
        <div className="p-5 rounded-xl bg-[#111724] border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block mb-2">
            Cinemas & Languages
          </span>
          <div className="flex flex-wrap gap-1.5">
            {preferences.cinemas.map((c) => (
              <span
                key={c}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-200"
              >
                {CINEMA_LABELS[c] || c.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Era */}
        <div className="p-5 rounded-xl bg-[#111724] border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block mb-2">
            Preferred Era
          </span>
          <span className="text-sm font-semibold text-white">
            {preferences.eras && preferences.eras.length > 0
              ? (preferences.eras.includes('any') ? 'Any Era (1930s to Present)' : preferences.eras.join(', ').toUpperCase())
              : (preferences.era === 'any' ? 'Any Era (1930s to Present)' : preferences.era.toUpperCase())}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            Search and discovery remain unrestricted across all decades.
          </p>
        </div>

        {/* Experience Type */}
        <div className="p-5 rounded-xl bg-[#111724] border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block mb-2">
            Experience Target
          </span>
          <span className="text-sm font-semibold text-white">
            {EXPERIENCE_LABELS[preferences.experience] || preferences.experience}
          </span>
        </div>

        {/* Length & Rating */}
        <div className="p-5 rounded-xl bg-[#111724] border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block mb-2">
            Movie Length & Rating
          </span>
          <div className="space-y-1 text-xs text-slate-300">
            <div>
              <span className="text-slate-500">Duration:</span>{' '}
              <span className="font-medium text-white">{preferences.movieLength}</span>
            </div>
            <div>
              <span className="text-slate-500">Minimum Rating:</span>{' '}
              <span className="font-medium text-white">
                {preferences.minRating > 0 ? `IMDb ${preferences.minRating.toFixed(1)}+ ★` : 'Any Rating'}
              </span>
            </div>
          </div>
        </div>

        {/* Watching With */}
        <div className="p-5 rounded-xl bg-[#111724] border border-slate-800">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block mb-2">
            Watching With
          </span>
          <span className="text-sm font-semibold text-white capitalize">
            {preferences.watchingWith}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            Discovery preference applied to family-friendly / group entertainment suggestions.
          </p>
        </div>
      </div>
    </div>
  );
};
