/**
 * Movie Recommendation & Discovery System - Main Application Entry
 * Built with React, TypeScript, Tailwind CSS, Express, Flask, and Scikit-Learn
 */

import React, { useState, useRef } from 'react';
import { Movie, RecommendationResponse } from './types';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';
import { Navbar } from './components/Navbar';
import { OnboardingModal } from './components/OnboardingModal';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { RecommendationsSection } from './components/RecommendationsSection';
import { SearchOverlay } from './components/SearchOverlay';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { GenresPage } from './pages/GenresPage';
import { LanguagesPage } from './pages/LanguagesPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { AboutPage } from './pages/AboutPage';

function MainLayout() {
  const { openOnboarding } = usePreferences();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Selected movie for full modal details view
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Machine Learning Recommendation State
  const [recTargetMovie, setRecTargetMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);

  // Cross-page navigation hints
  const [discoverGenreFilter, setDiscoverGenreFilter] = useState<string>('all');
  const [discoverLanguageFilter, setDiscoverLanguageFilter] = useState<string>('all');

  const recSectionRef = useRef<HTMLDivElement>(null);

  // Open movie details modal
  const handleOpenMovieDetails = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsDetailsOpen(true);
  };

  // Trigger Content-Based ML Recommendations for a selected movie
  const handleGetRecommendations = async (movie: Movie) => {
    setIsDetailsOpen(false);
    setRecTargetMovie(movie);
    setIsLoadingRecs(true);
    setRecommendations([]);

    setTimeout(() => {
      recSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      const params = new URLSearchParams({
        movie: movie.title,
        tmdb_id: String(movie.id),
        limit: '8',
      });
      const res = await fetch(`/api/recommend?${params.toString()}`);
      if (res.ok) {
        const data: RecommendationResponse = await res.json();
        setRecommendations(data.recommendations || []);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Recommendation fetch exception:', err);
      setRecommendations([]);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleNavigateToDiscoverWithGenre = (genreId: string) => {
    setDiscoverGenreFilter(genreId);
    setDiscoverLanguageFilter('all');
    setCurrentTab('discover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToDiscoverWithLanguage = (langCode: string) => {
    setDiscoverLanguageFilter(langCode);
    setDiscoverGenreFilter('all');
    setCurrentTab('discover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* 3-Zone Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPreferences={openOnboarding}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ML Recommendations Anchor */}
        <div ref={recSectionRef}>
          {(recTargetMovie || isLoadingRecs) && (
            <RecommendationsSection
              selectedMovie={recTargetMovie}
              recommendations={recommendations}
              isLoading={isLoadingRecs}
              onSelectMovie={handleOpenMovieDetails}
              onClose={() => {
                setRecTargetMovie(null);
                setRecommendations([]);
              }}
            />
          )}
        </div>

        {/* Dynamic Page Views */}
        {currentTab === 'home' && (
          <HomePage
            onSelectMovie={handleOpenMovieDetails}
          />
        )}

        {currentTab === 'discover' && (
          <DiscoverPage
            onSelectMovie={handleOpenMovieDetails}
            initialGenre={discoverGenreFilter}
            initialLanguage={discoverLanguageFilter}
          />
        )}

        {currentTab === 'genres' && (
          <GenresPage
            onSelectMovie={handleOpenMovieDetails}
            onNavigateToDiscoverWithGenre={handleNavigateToDiscoverWithGenre}
          />
        )}

        {currentTab === 'languages' && (
          <LanguagesPage
            onSelectMovie={handleOpenMovieDetails}
            onNavigateToDiscoverWithLanguage={handleNavigateToDiscoverWithLanguage}
          />
        )}

        {currentTab === 'preferences' && (
          <PreferencesPage />
        )}

        {currentTab === 'about' && <AboutPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#090d16] py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-300 text-sm tracking-tight block">
              CINEMATCH
            </span>
            <span className="text-slate-500 mt-0.5 block">
              Content-Based Movie Recommendation & Global Discovery Platform
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setCurrentTab('home')} className="hover:text-white transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => setCurrentTab('discover')} className="hover:text-white transition-colors cursor-pointer">
              Discover
            </button>
            <button onClick={() => setCurrentTab('genres')} className="hover:text-white transition-colors cursor-pointer">
              Genres
            </button>
            <button onClick={() => setCurrentTab('languages')} className="hover:text-white transition-colors cursor-pointer">
              Languages
            </button>
            <button onClick={() => setCurrentTab('preferences')} className="hover:text-white transition-colors cursor-pointer">
              My Preferences
            </button>
            <button onClick={() => setCurrentTab('about')} className="hover:text-white transition-colors cursor-pointer">
              About Algorithm
            </button>
          </div>
        </div>
      </footer>

      {/* Multi-Step Onboarding Modal with Centralized State Manager */}
      <OnboardingModal />

      {/* Detailed Movie View Modal */}
      <MovieDetailsModal
        movie={selectedMovie}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onGetRecommendations={handleGetRecommendations}
        isLoadingRecommendations={isLoadingRecs}
      />

      {/* Global Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMovie={handleOpenMovieDetails}
      />
    </div>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <MainLayout />
    </PreferencesProvider>
  );
}
