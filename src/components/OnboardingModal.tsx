import React, { useState } from 'react';
import {
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Film,
  Clock,
  Star,
  Globe,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

// STEP 1: GENRE DATA
const GENRE_OPTIONS = [
  { id: '28', label: 'Action', desc: 'Explosive stunts & adrenaline', emoji: '🎬' },
  { id: '35', label: 'Comedy', desc: 'Laughs, wit & lighthearted humor', emoji: '😂' },
  { id: '18', label: 'Drama', desc: 'Compelling character depth', emoji: '🎭' },
  { id: '53', label: 'Thriller', desc: 'Edge-of-your-seat suspense', emoji: '🔥' },
  { id: '878', label: 'Sci-Fi', desc: 'Futuristic ideas & mindbenders', emoji: '🚀' },
  { id: '27', label: 'Horror', desc: 'Chills, jumpscares & psychological terror', emoji: '😱' },
  { id: '10749', label: 'Romance', desc: 'Intimacy, passion & connection', emoji: '❤️' },
  { id: '9648', label: 'Mystery', desc: 'Intriguing whodunits & puzzles', emoji: '🔍' },
  { id: '12', label: 'Adventure', desc: 'Epic journeys & exploration', emoji: '🗺️' },
  { id: '80', label: 'Crime', desc: 'Underworld syndicates & cops', emoji: '🕵️' },
  { id: '14', label: 'Fantasy', desc: 'Mythical realms, magic & lore', emoji: '🧙' },
  { id: '10751', label: 'Family', desc: 'Wholesome viewing for all ages', emoji: '👨‍👩‍👧' },
  { id: '16', label: 'Animation', desc: 'Visual creativity & anime', emoji: '💫' },
  { id: '10752', label: 'War', desc: 'Military valor & historical battles', emoji: '⚔️' },
  { id: '37', label: 'Western', desc: 'Frontier outlaws & gunslingers', emoji: '🤠' },
  { id: '99', label: 'Documentary', desc: 'Factual real-world chronicles', emoji: '🎞️' },
  { id: '10402', label: 'Musical', desc: 'Score, rhythm & showtunes', emoji: '🎵' },
];

// STEP 2: ERA DATA
const ERA_OPTIONS = [
  { id: 'any', label: 'Any Era', period: '1930s to Present' },
  { id: '2020s', label: '2020s', period: 'Contemporary Releases' },
  { id: '2010s', label: '2010s', period: 'Peak Modern Cinema' },
  { id: '2000s', label: '2000s', period: 'Digital Age & Franchise Boom' },
  { id: '1990s', label: '1990s', period: 'Modern Classics & Indieland' },
  { id: '1980s', label: '1980s', period: 'Action Blockbusters & Sci-Fi' },
  { id: '1970s', label: '1970s', period: 'New Hollywood & Auteur Wave' },
  { id: '1960s', label: '1960s', period: 'Cinematic New Waves' },
  { id: '1950s', label: '1950s', period: 'Post-War Classics' },
  { id: '1940s', label: '1940s', period: 'Film Noir & Wartime Classics' },
  { id: '1930s', label: '1930s', period: 'Golden Age of Hollywood' },
];

// STEP 3: RUNTIME DATA
const RUNTIME_OPTIONS = [
  { id: 'any', label: 'Any Length', desc: 'No duration restrictions' },
  { id: 'under_90', label: 'Under 90 min', desc: 'Fast, brisk & breezy watch' },
  { id: '90_120', label: '90–120 min', desc: 'Standard sweet-spot film runtime' },
  { id: '120_150', label: '120–150 min', desc: 'Detailed, immersive cinematic narrative' },
  { id: '150_plus', label: '150+ min', desc: 'Grand scale epic movies and sagas' },
];

// STEP 4: RATING DATA (Real IMDb scores)
const RATING_OPTIONS = [
  { value: 0, label: 'Any Rating', desc: 'Open to all audience scores' },
  { value: 6, label: 'IMDb 6.0+', desc: 'Entertaining, solid watch' },
  { value: 7, label: 'IMDb 7.0+', desc: 'Widely praised, high quality' },
  { value: 8, label: 'IMDb 8.0+', desc: 'Critically acclaimed excellence' },
  { value: 9, label: 'IMDb 9.0+', desc: 'All-time cinematic masterpieces' },
];

// STEP 5: LANGUAGE / CINEMA DATA
const INDIAN_CINEMAS = [
  { code: 'hi', label: 'Hindi', cinema: 'Bollywood' },
  { code: 'te', label: 'Telugu', cinema: 'Tollywood' },
  { code: 'ta', label: 'Tamil', cinema: 'Kollywood' },
  { code: 'ml', label: 'Malayalam', cinema: 'Mollywood' },
  { code: 'kn', label: 'Kannada', cinema: 'Sandalwood' },
  { code: 'bn', label: 'Bengali', cinema: 'Bengali Cinema' },
  { code: 'mr', label: 'Marathi', cinema: 'Marathi Cinema' },
  { code: 'pa', label: 'Punjabi', cinema: 'Pollywood' },
  { code: 'gu', label: 'Gujarati', cinema: 'Gujarati Cinema' },
];

const INTERNATIONAL_CINEMAS = [
  { code: 'en', label: 'English', cinema: 'Hollywood & Global' },
  { code: 'ko', label: 'Korean', cinema: 'Korean Cinema' },
  { code: 'ja', label: 'Japanese', cinema: 'Japanese Cinema & Anime' },
  { code: 'zh', label: 'Chinese', cinema: 'Chinese Cinema' },
  { code: 'fr', label: 'French', cinema: 'French Cinema' },
  { code: 'es', label: 'Spanish', cinema: 'Spanish & Latin Cinema' },
  { code: 'de', label: 'German', cinema: 'German Cinema' },
  { code: 'it', label: 'Italian', cinema: 'Italian Cinema' },
];

const STEP_METADATA = [
  { id: 1, title: 'Genre', icon: Film, description: 'What genres are you in the mood for?' },
  { id: 2, title: 'Era', icon: Calendar, description: 'Which eras do you feel like watching?' },
  { id: 3, title: 'Runtime', icon: Clock, description: 'How much time do you have?' },
  { id: 4, title: 'Rating', icon: Star, description: 'Minimum verified IMDb rating?' },
  { id: 5, title: 'Language', icon: Globe, description: 'Which cinemas do you want to explore?' },
  { id: 6, title: 'Profile', icon: Sparkles, description: 'Your personalized discovery profile' },
];

export const OnboardingModal: React.FC = () => {
  const {
    preferences,
    isOnboardingOpen,
    closeOnboarding,
    toggleMoodGenre,
    toggleEra,
    setMovieLength,
    setMinRating,
    toggleCinema,
    savePreferences,
    isStepValid,
  } = usePreferences();

  // Multi-step local index (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!isOnboardingOpen) return null;

  // Validation for current step
  const canContinue = isStepValid(currentStep);

  const handleNext = () => {
    if (canContinue && currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      closeOnboarding();
    }
  };

  const handleFinish = () => {
    savePreferences();
  };

  const handleSkip = () => {
    savePreferences({
      moodGenres: ['28', '18', '53'],
      eras: ['any'],
      era: 'any',
      movieLength: 'any',
      minRating: 0,
      cinemas: ['any'],
    });
  };

  // Helper summary text
  const getGenreDisplay = () =>
    preferences.moodGenres
      .map((gid) => GENRE_OPTIONS.find((g) => g.id === gid)?.label)
      .filter(Boolean)
      .join(' • ');

  const getEraDisplay = () => {
    if (!preferences.eras || preferences.eras.includes('any')) return 'Any Era (1930s to Present)';
    return preferences.eras.join(' • ');
  };

  const getRuntimeDisplay = () =>
    RUNTIME_OPTIONS.find((r) => r.id === preferences.movieLength)?.label || 'Any Length';

  const getRatingDisplay = () =>
    RATING_OPTIONS.find((r) => r.value === preferences.minRating)?.label || 'Any Rating';

  const getCinemaDisplay = () => {
    if (!preferences.cinemas || preferences.cinemas.includes('any')) return 'Worldwide Cinema';
    const all = [...INDIAN_CINEMAS, ...INTERNATIONAL_CINEMAS];
    return preferences.cinemas
      .map((c) => all.find((item) => item.code === c)?.label || c.toUpperCase())
      .join(' • ');
  };

  const progressPercent = ((currentStep - 1) / 5) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0e1422] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Step Indicator Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-800/90 bg-[#121927]">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                {currentStep === 6 ? 'PROFILE SUMMARY' : `STEP ${currentStep} OF 5: ${STEP_METADATA[currentStep - 1]?.title.toUpperCase()}`}
              </span>
            </div>

            <button
              onClick={closeOnboarding}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar & Interactive Step Nodes */}
          <div className="space-y-2">
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-300 ease-out"
                style={{ width: `${currentStep === 6 ? 100 : Math.max(progressPercent, 12)}%` }}
              />
            </div>

            {/* Step Pills Navigator */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {STEP_METADATA.slice(0, 5).map((meta) => {
                const isActive = currentStep === meta.id;
                const isCompleted = currentStep > meta.id;
                return (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => {
                      if (currentStep > meta.id) setCurrentStep(meta.id);
                    }}
                    disabled={currentStep < meta.id}
                    className={`py-1 px-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                        : isCompleted
                        ? 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 cursor-pointer'
                        : 'text-slate-600 border border-transparent cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span>{meta.title}</span>
                    {isCompleted && <Check className="w-2.5 h-2.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Body */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto min-h-[380px]">
          {/* STEP 1: GENRE */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  WHAT ARE YOU IN THE MOOD FOR?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Select at least 1 genre (up to 5) to shape your recommendation baseline.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {GENRE_OPTIONS.map((g) => {
                  const isSelected = preferences.moodGenres.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleMoodGenre(g.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[66px] ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10 scale-[1.01]'
                          : 'bg-[#111724] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs sm:text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                          <span>{g.emoji}</span>
                          <span>{g.label.toUpperCase()}</span>
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-normal">
                        {g.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: ERA */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  WHICH ERA DO YOU FEEL LIKE WATCHING?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Choose specific historical decades or select Any Era. Multiple selections supported.
                </p>
              </div>

              {/* Any Era Choice */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleEra('any')}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    preferences.eras && preferences.eras.includes('any')
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-[#111724] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>Any Era &bull; From 1930s Golden Age to 2020s Contemporary</span>
                  {preferences.eras && preferences.eras.includes('any') && (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                </button>
              </div>

              {/* Decade Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                {ERA_OPTIONS.filter((e) => e.id !== 'any').map((e) => {
                  const isSelected = preferences.eras && preferences.eras.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleEra(e.id)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[72px] ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm scale-[1.02]'
                          : 'bg-[#111724] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm font-bold text-white block">{e.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{e.period}</span>
                      {isSelected && (
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center mt-1.5">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: RUNTIME */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  HOW MUCH TIME DO YOU HAVE?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Select your desired movie duration window.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {RUNTIME_OPTIONS.map((r) => {
                  const isSelected = preferences.movieLength === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setMovieLength(r.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-[#111724] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-white">{r.label}</div>
                        <div className="text-[10px] text-slate-400">{r.desc}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: RATING */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  HOW HIGHLY RATED SHOULD YOUR PICKS BE?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Filters against authentic, verified IMDb ratings directly from real audience data.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {RATING_OPTIONS.map((rate) => {
                  const isSelected = preferences.minRating === rate.value;
                  return (
                    <button
                      key={rate.value}
                      type="button"
                      onClick={() => setMinRating(rate.value)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-[#111724] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                          <span>{rate.label}</span>
                          {rate.value > 0 && (
                            <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1 rounded border border-amber-500/20">
                              Real IMDb Score
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{rate.desc}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: LANGUAGE / CINEMA */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  WHICH CINEMA DO YOU WANT TO EXPLORE?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Choose specific regional Indian industries, global cinema, or all languages.
                </p>
              </div>

              {/* Any Cinema Pill */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleCinema('any')}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    preferences.cinemas && preferences.cinemas.includes('any')
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-[#111724] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>🌎 Any Language & Cinema Worldwide</span>
                  {preferences.cinemas && preferences.cinemas.includes('any') && (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                </button>
              </div>

              {/* Indian Cinema Section */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  🇮🇳 Indian Regional Cinema
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INDIAN_CINEMAS.map((c) => {
                    const isSelected = preferences.cinemas && preferences.cinemas.includes(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => toggleCinema(c.code)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                            : 'bg-[#111724] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="text-xs font-semibold text-white truncate">{c.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{c.cinema}</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* International Section */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                  International Cinema
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INTERNATIONAL_CINEMAS.map((c) => {
                    const isSelected = preferences.cinemas && preferences.cinemas.includes(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => toggleCinema(c.code)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-sm'
                            : 'bg-[#111724] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="text-xs font-semibold text-white truncate">{c.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{c.cinema}</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PROFILE SUMMARY */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
                  Taste Profile Configured
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  YOUR MOVIE PROFILE
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Preferences synchronized across the recommendation system. Click Find My Movies to explore.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-[#111724] border border-slate-800 space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 block text-[11px] uppercase font-mono mb-0.5">Genres</span>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <span className="text-white font-semibold text-sm">{getGenreDisplay()}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 block text-[11px] uppercase font-mono mb-0.5">Eras / Decades</span>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <span className="text-white font-semibold text-sm">{getEraDisplay()}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Runtime</span>
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <span className="text-slate-200 font-medium">{getRuntimeDisplay()}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Min Rating</span>
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <span className="text-amber-400 font-medium">{getRatingDisplay()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 block text-[11px] uppercase font-mono mb-0.5">Cinemas & Languages</span>
                    <button
                      onClick={() => setCurrentStep(5)}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <span className="text-white font-semibold text-sm">{getCinemaDisplay()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 bg-[#121927] border-t border-slate-800 flex items-center justify-between gap-4">
          {/* Left Action: Back or Skip */}
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {/* Right Action: Counter & Continue / Finish Button */}
          <div className="flex items-center gap-3">
            {/* Step Selection Status Hints */}
            {currentStep === 1 && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                {preferences.moodGenres.length} selected (max 5)
              </span>
            )}
            {currentStep === 2 && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                {preferences.eras && preferences.eras.includes('any') ? 'All eras' : `${preferences.eras?.length || 0} eras`}
              </span>
            )}
            {currentStep === 5 && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                {preferences.cinemas && preferences.cinemas.includes('any') ? 'Worldwide' : `${preferences.cinemas?.length || 0} selected`}
              </span>
            )}

            {/* Validation warning if disabled */}
            {!canContinue && (
              <span className="text-[11px] text-amber-400/90 hidden sm:flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Selection required</span>
              </span>
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinue}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-xl hover:shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>FIND MY MOVIES</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
