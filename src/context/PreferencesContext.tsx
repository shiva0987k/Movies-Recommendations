import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserPreferences } from '../types';

const STORAGE_KEY = 'cinematch_preferences_v3';

export const DEFAULT_PREFERENCES: UserPreferences = {
  moodGenres: ['28', '53'], // Action, Thriller default
  eras: ['any'],
  era: 'any',
  movieLength: 'any',
  minRating: 0,
  cinemas: ['any'],
  experience: 'popular',
  hasCompletedOnboarding: false,
};

interface PreferencesContextType {
  preferences: UserPreferences;
  isOnboardingOpen: boolean;
  openOnboarding: (step?: number) => void;
  closeOnboarding: () => void;
  setMoodGenres: (genres: string[]) => void;
  toggleMoodGenre: (genreId: string) => void;
  setEras: (eras: string[]) => void;
  toggleEra: (eraId: string) => void;
  setMovieLength: (length: string) => void;
  setMinRating: (rating: number) => void;
  setCinemas: (cinemas: string[]) => void;
  toggleCinema: (cinemaCode: string) => void;
  setExperience: (exp: string) => void;
  savePreferences: (newPrefs?: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  isStepValid: (step: number) => boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          eras: parsed.eras && parsed.eras.length > 0 ? parsed.eras : (parsed.era ? [parsed.era] : ['any']),
          cinemas: parsed.cinemas && parsed.cinemas.length > 0 ? parsed.cinemas : ['any'],
          moodGenres: parsed.moodGenres && parsed.moodGenres.length > 0 ? parsed.moodGenres : ['28', '53'],
        };
      }
    } catch (e) {
      console.error('Failed to load preferences from storage:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    // If not completed onboarding previously, open modal
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return true;
      const parsed = JSON.parse(stored);
      return !parsed.hasCompletedOnboarding;
    } catch {
      return true;
    }
  });

  const openOnboarding = () => setIsOnboardingOpen(true);
  const closeOnboarding = () => setIsOnboardingOpen(false);

  // Sync to localStorage whenever preferences change and completed
  const persist = (updated: UserPreferences) => {
    setPreferences(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist preferences:', e);
    }
  };

  const setMoodGenres = (genres: string[]) => {
    persist({ ...preferences, moodGenres: genres });
  };

  const toggleMoodGenre = (genreId: string) => {
    setPreferences((prev) => {
      const exists = prev.moodGenres.includes(genreId);
      let updated: string[];
      if (exists) {
        updated = prev.moodGenres.filter((id) => id !== genreId);
      } else {
        if (prev.moodGenres.length >= 5) return prev; // max 5
        updated = [...prev.moodGenres, genreId];
      }
      const newPrefs = { ...prev, moodGenres: updated };
      persist(newPrefs);
      return newPrefs;
    });
  };

  const setEras = (eras: string[]) => {
    const eraStr = eras.includes('any') ? 'any' : eras.join(',');
    persist({ ...preferences, eras, era: eraStr });
  };

  const toggleEra = (eraId: string) => {
    setPreferences((prev) => {
      const current = prev.eras || ['any'];
      let updated: string[];
      if (eraId === 'any') {
        updated = ['any'];
      } else {
        const withoutAny = current.filter((e) => e !== 'any');
        if (withoutAny.includes(eraId)) {
          const next = withoutAny.filter((e) => e !== eraId);
          updated = next.length === 0 ? ['any'] : next;
        } else {
          updated = [...withoutAny, eraId];
        }
      }
      const eraStr = updated.includes('any') ? 'any' : updated.join(',');
      const newPrefs = { ...prev, eras: updated, era: eraStr };
      persist(newPrefs);
      return newPrefs;
    });
  };

  const setMovieLength = (movieLength: string) => {
    persist({ ...preferences, movieLength });
  };

  const setMinRating = (minRating: number) => {
    persist({ ...preferences, minRating });
  };

  const setCinemas = (cinemas: string[]) => {
    persist({ ...preferences, cinemas });
  };

  const toggleCinema = (cinemaCode: string) => {
    setPreferences((prev) => {
      const current = prev.cinemas || ['any'];
      let updated: string[];
      if (cinemaCode === 'any') {
        updated = ['any'];
      } else {
        const withoutAny = current.filter((c) => c !== 'any');
        if (withoutAny.includes(cinemaCode)) {
          const next = withoutAny.filter((c) => c !== cinemaCode);
          updated = next.length === 0 ? ['any'] : next;
        } else {
          updated = [...withoutAny, cinemaCode];
        }
      }
      const newPrefs = { ...prev, cinemas: updated };
      persist(newPrefs);
      return newPrefs;
    });
  };

  const setExperience = (experience: string) => {
    persist({ ...preferences, experience });
  };

  const savePreferences = (newPrefs?: Partial<UserPreferences>) => {
    const updated: UserPreferences = {
      ...preferences,
      ...(newPrefs || {}),
      hasCompletedOnboarding: true,
    };
    persist(updated);
    closeOnboarding();
  };

  const resetPreferences = () => {
    const resetState: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      hasCompletedOnboarding: true,
    };
    persist(resetState);
  };

  // Step validation rule engine
  // Steps: 1: Genre, 2: Era, 3: Runtime, 4: Rating, 5: Language, 6: Summary
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: // Genre: mandatory, at least 1 selection
        return Boolean(preferences.moodGenres && preferences.moodGenres.length > 0);
      case 2: // Era: mandatory, at least 1 selection
        return Boolean(preferences.eras && preferences.eras.length > 0);
      case 3: // Runtime: mandatory, length must be defined
        return Boolean(preferences.movieLength);
      case 4: // Rating: mandatory, rating number defined
        return typeof preferences.minRating === 'number' && preferences.minRating >= 0;
      case 5: // Language: mandatory, at least 1 cinema/language selected
        return Boolean(preferences.cinemas && preferences.cinemas.length > 0);
      case 6: // Summary
        return true;
      default:
        return true;
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        isOnboardingOpen,
        openOnboarding,
        closeOnboarding,
        setMoodGenres,
        toggleMoodGenre,
        setEras,
        toggleEra,
        setMovieLength,
        setMinRating,
        setCinemas,
        toggleCinema,
        setExperience,
        savePreferences,
        resetPreferences,
        isStepValid,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
