export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  year: string;
  release_date?: string;
  rating: number; // General rating
  tmdb_rating?: number | null;
  imdb_rating?: number | null; // Real IMDb score from OMDB
  imdb_votes?: string | null;
  imdb_id?: string | null;
  vote_count?: number;
  language: string;
  cinema?: string;
  genre: string;
  genres_list?: string[];
  overview: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  director?: string;
  cast?: string;
  runtime?: number;
  country?: string;
  tagline?: string;
  similarity?: number;
  similarity_pct?: number;
}

export interface UserPreferences {
  moodGenres: string[];
  cinemas: string[];
  era: string;
  eras?: string[];
  experience: string;
  movieLength: string;
  minRating: number;
  watchingWith?: string;
  hasCompletedOnboarding: boolean;
}

export interface RecommendationResponse {
  selected_movie: Movie;
  recommendations: Movie[];
  total_candidates: number;
  engine?: string;
}

export interface GenreItem {
  id: number;
  name: string;
  description?: string;
}

export interface LanguageItem {
  code: string;
  name: string;
  cinema: string;
  flag: string;
}
