"""
Movie Recommendation System - Content-Based Recommendation Engine
Uses TF-IDF Vectorization and Cosine Similarity on real movie dataset attributes
(genres, keywords, overview, cast, director).
"""

import os
import re
from typing import Dict, List, Optional, Any
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class MovieRecommender:
    """
    Content-Based Movie Recommender using TF-IDF and Cosine Similarity.
    """

    def __init__(self, dataset_path: str = "data/movies.csv"):
        self.dataset_path = dataset_path
        self.df: Optional[pd.DataFrame] = None
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.title_to_index: Dict[str, int] = {}
        self.id_to_index: Dict[int, int] = {}
        self.is_initialized: bool = False
        self._load_and_train()

    def _normalize_title(self, title: str) -> str:
        """Normalize title for lookup: lowercased, stripped, cleaned whitespace."""
        if not isinstance(title, str):
            return ""
        return title.strip().lower()

    def _extract_year(self, val: Any) -> str:
        """Extract 4-digit release year from date string or number."""
        if pd.isna(val) or val is None:
            return "N/A"
        val_str = str(val).strip()
        match = re.search(r"\b(19\d{2}|20\d{2})\b", val_str)
        if match:
            return match.group(1)
        return "N/A"

    def _load_and_train(self):
        """Loads dataset, cleans missing values, and builds TF-IDF matrix."""
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(
                f"Dataset not found at {self.dataset_path}. "
                f"Please ensure data/movies.csv is present."
            )

        # Load CSV safely with fallback encoding
        try:
            df = pd.read_csv(self.dataset_path, low_memory=False)
        except UnicodeDecodeError:
            df = pd.read_csv(self.dataset_path, encoding="latin1", low_memory=False)

        # Normalize column names to standard keys
        col_map = {}
        for col in df.columns:
            cleaned = col.strip()
            lower = cleaned.lower()
            if "title" in lower:
                col_map[col] = "title"
            elif "genre" in lower:
                col_map[col] = "genres"
            elif "overview" in lower or "description" in lower:
                col_map[col] = "overview"
            elif "keyword" in lower:
                col_map[col] = "keywords"
            elif "director" in lower:
                col_map[col] = "director"
            elif "cast" in lower:
                col_map[col] = "cast"
            elif "vote_average" in lower or "vote" in lower or "rating" in lower:
                if "count" not in lower:
                    col_map[col] = "rating"
                else:
                    col_map[col] = "vote_count"
            elif "release" in lower or "date" in lower or "year" in lower:
                col_map[col] = "release_date"
            elif "popularity" in lower:
                col_map[col] = "popularity"
            elif "runtime" in lower:
                col_map[col] = "runtime"
            elif "language" in lower:
                col_map[col] = "language"
            elif "country" in lower:
                col_map[col] = "country"

        df = df.rename(columns=col_map)

        # Ensure required columns exist
        for req in ["title", "genres", "overview", "keywords", "cast", "director", "rating"]:
            if req not in df.columns:
                df[req] = ""

        # Clean title column and drop invalid/empty titles
        df["title"] = df["title"].fillna("").astype(str).str.strip()
        df = df[df["title"].str.len() > 0].copy()
        df = df.drop_duplicates(subset=["title"]).reset_index(drop=True)

        # Fill missing values for text fields
        df["genres"] = df["genres"].fillna("").astype(str)
        df["overview"] = df["overview"].fillna("").astype(str)
        df["keywords"] = df["keywords"].fillna("").astype(str)
        df["cast"] = df["cast"].fillna("").astype(str)
        df["director"] = df["director"].fillna("").astype(str)
        df["language"] = df.get("language", pd.Series(["en"] * len(df))).fillna("en").astype(str)

        # Clean ratings
        df["rating_clean"] = pd.to_numeric(df["rating"], errors="coerce").fillna(0.0).round(1)

        # Clean runtime
        if "runtime" in df.columns:
            df["runtime_clean"] = pd.to_numeric(df["runtime"], errors="coerce").fillna(0).astype(int)
        else:
            df["runtime_clean"] = 0

        # Extract release year
        if "release_date" in df.columns:
            df["year"] = df["release_date"].apply(self._extract_year)
        else:
            df["year"] = "N/A"

        # Combine content features into a single text representation
        # Weight keywords, genres, and director slightly higher by repeating them
        df["features"] = (
            df["genres"] + " " + df["genres"] + " " +
            df["keywords"] + " " +
            df["overview"] + " " +
            df["cast"] + " " +
            df["director"] + " " + df["director"]
        ).str.strip()

        # Build TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            max_features=12000,
            ngram_range=(1, 2),
            sublinear_tf=True
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(df["features"])

        # Create title lookup and ID lookup indices
        self.title_to_index = {
            self._normalize_title(t): idx for idx, t in enumerate(df["title"])
        }

        self.id_to_index = {}
        for idx, row in df.iterrows():
            m_id = row.get("Movie_ID", None)
            if pd.notna(m_id):
                try:
                    self.id_to_index[int(m_id)] = idx
                except (ValueError, TypeError):
                    pass

        self.df = df
        self.is_initialized = True

    def search_movies(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search movies matching query with case-insensitive partial match.
        Matches prioritized by: exact match > prefix match > word match > substring.
        """
        if not self.is_initialized or self.df is None:
            raise RuntimeError("Recommender is not initialized.")

        q = self._normalize_title(query)
        if not q:
            return []

        results = []
        titles = self.df["title"].tolist()

        exact_matches = []
        prefix_matches = []
        contains_matches = []

        for idx, title in enumerate(titles):
            norm = self._normalize_title(title)
            if norm == q:
                exact_matches.append(idx)
            elif norm.startswith(q):
                prefix_matches.append(idx)
            elif q in norm:
                contains_matches.append(idx)

        # Combine ordered list of indices without duplicates
        ordered_indices = []
        seen = set()
        for idx in exact_matches + prefix_matches + contains_matches:
            if idx not in seen:
                seen.add(idx)
                ordered_indices.append(idx)
            if len(ordered_indices) >= limit:
                break

        for idx in ordered_indices:
            results.append(self._format_movie_dict(idx))

        return results

    def find_movie_index(self, movie_title: str) -> Optional[int]:
        """Find the row index of a movie by exact or fuzzy normalized match."""
        if not self.is_initialized or self.df is None:
            return None

        norm = self._normalize_title(movie_title)
        if norm in self.title_to_index:
            return self.title_to_index[norm]

        # Try prefix or substring fallback
        for t_norm, idx in self.title_to_index.items():
            if t_norm.startswith(norm) or norm in t_norm:
                return idx

        return None

    def _format_movie_dict(self, idx: int, similarity: Optional[float] = None) -> Dict[str, Any]:
        """Convert a row index into a clean movie payload dictionary."""
        row = self.df.iloc[idx]
        movie_id = int(row.get("Movie_ID", idx + 1)) if "Movie_ID" in row and pd.notna(row.get("Movie_ID")) else idx + 1
        movie_dict = {
            "id": movie_id,
            "title": str(row["title"]),
            "genre": str(row["genres"]) if str(row["genres"]) else "General",
            "overview": str(row["overview"]) if str(row["overview"]) else "No overview available.",
            "rating": float(row["rating_clean"]),
            "year": str(row["year"]),
            "director": str(row["director"]) if str(row["director"]) else "Unknown",
            "cast": str(row["cast"]) if str(row["cast"]) else "",
            "language": str(row.get("language", "en")),
            "runtime": int(row.get("runtime_clean", 0)),
        }
        if similarity is not None:
            movie_dict["similarity"] = round(float(similarity), 3)
            movie_dict["similarity_pct"] = int(round(similarity * 100))
        return movie_dict

    def recommend(self, movie_title: str, top_n: int = 8) -> Dict[str, Any]:
        """
        Calculate content-based recommendations for a selected movie title.
        Returns selected movie details and top_n recommended movies with similarity scores.
        """
        if not self.is_initialized or self.df is None:
            raise RuntimeError("Recommender is not initialized.")

        idx = self.find_movie_index(movie_title)
        if idx is None:
            raise ValueError(f"Movie '{movie_title}' not found in dataset.")

        # Compute cosine similarity between the target movie and all movies in the dataset
        target_vector = self.tfidf_matrix[idx]
        sim_scores = cosine_similarity(target_vector, self.tfidf_matrix).flatten()

        # Sort indices by similarity descending
        # Exclude the query movie itself (index `idx`)
        sim_indices = np.argsort(sim_scores)[::-1]
        recommendations = []

        for candidate_idx in sim_indices:
            if candidate_idx == idx:
                continue
            sim_val = sim_scores[candidate_idx]
            recommendations.append(self._format_movie_dict(candidate_idx, similarity=sim_val))
            if len(recommendations) >= top_n:
                break

        return {
            "selected_movie": self._format_movie_dict(idx),
            "recommendations": recommendations,
            "total_candidates": len(self.df)
        }

    def recommend_for_external(self, movie_data: Dict[str, Any], top_n: int = 8) -> Dict[str, Any]:
        """
        Calculates content-based TF-IDF cosine similarity for an external movie
        (e.g., from TMDB or regional cinema) against the catalog.
        """
        if not self.is_initialized or self.df is None:
            raise RuntimeError("Recommender is not initialized.")

        genres = str(movie_data.get("genre", "") or movie_data.get("genres", ""))
        keywords = str(movie_data.get("keywords", ""))
        overview = str(movie_data.get("overview", ""))
        cast = str(movie_data.get("cast", ""))
        director = str(movie_data.get("director", ""))

        composite_features = (
            genres + " " + genres + " " +
            keywords + " " +
            overview + " " +
            cast + " " +
            director + " " + director
        ).strip()

        target_vector = self.vectorizer.transform([composite_features])
        sim_scores = cosine_similarity(target_vector, self.tfidf_matrix).flatten()

        sim_indices = np.argsort(sim_scores)[::-1]
        recommendations = []

        target_title = self._normalize_title(movie_data.get("title", ""))

        for candidate_idx in sim_indices:
            candidate_title = self._normalize_title(self.df.iloc[candidate_idx]["title"])
            if candidate_title == target_title:
                continue
            sim_val = sim_scores[candidate_idx]
            recommendations.append(self._format_movie_dict(candidate_idx, similarity=sim_val))
            if len(recommendations) >= top_n:
                break

        return {
            "selected_movie": movie_data,
            "recommendations": recommendations,
            "total_candidates": len(self.df)
        }

    def get_featured_movies(self, limit: int = 8) -> List[Dict[str, Any]]:
        """Return popular / well-known featured movies for quick discovery."""
        if not self.is_initialized or self.df is None:
            return []

        # Find iconic titles if available, otherwise highest rated with votes
        iconic_titles = [
            "Inception", "The Dark Knight", "Interstellar", "The Godfather",
            "Avatar", "Pulp Fiction", "The Matrix", "Fight Club", "Gladiator", "Titanic"
        ]
        featured = []
        seen = set()

        for t in iconic_titles:
            idx = self.find_movie_index(t)
            if idx is not None and idx not in seen:
                seen.add(idx)
                featured.append(self._format_movie_dict(idx))
            if len(featured) >= limit:
                break

        # Fallback to top rated if some iconic titles missing
        if len(featured) < limit:
            sorted_indices = self.df.sort_values(by="rating_clean", ascending=False).index
            for idx in sorted_indices:
                if idx not in seen:
                    seen.add(idx)
                    featured.append(self._format_movie_dict(idx))
                if len(featured) >= limit:
                    break

        return featured
