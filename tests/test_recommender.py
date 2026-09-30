"""
Unit tests for the Content-Based Movie Recommendation Engine.
Tests dataset loading, search, recommendations, error handling, and ranking.
"""

import os
import sys

# Ensure repository root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import pandas as pd
from recommender import MovieRecommender


@pytest.fixture(scope="module")
def recommender_instance():
    """Provides a shared initialized instance of MovieRecommender."""
    dataset_path = "data/movies.csv"
    if not os.path.exists(dataset_path):
        pytest.skip("Dataset file data/movies.csv not present for test execution.")
    return MovieRecommender(dataset_path=dataset_path)


def test_dataset_loading(recommender_instance):
    """Test 1: Dataset loading and initialization."""
    assert recommender_instance.is_initialized is True
    assert recommender_instance.df is not None
    assert len(recommender_instance.df) > 100
    assert "title" in recommender_instance.df.columns
    assert "genres" in recommender_instance.df.columns
    assert "features" in recommender_instance.df.columns
    assert recommender_instance.tfidf_matrix is not None


def test_movie_search(recommender_instance):
    """Test 2: Movie search with case-insensitive and partial queries."""
    # Exact case-insensitive match
    results = recommender_instance.search_movies("inception", limit=5)
    assert len(results) > 0
    assert any("inception" in r["title"].lower() for r in results)

    # Prefix match
    results_prefix = recommender_instance.search_movies("star war", limit=5)
    assert len(results_prefix) > 0
    assert any("star wars" in r["title"].lower() for r in results_prefix)

    # Empty query should return empty list
    empty_results = recommender_instance.search_movies("", limit=5)
    assert empty_results == []


def test_recommendation_function(recommender_instance):
    """Test 3: Recommendation function calculates real cosine similarities."""
    res = recommender_instance.recommend("Inception", top_n=5)
    assert "selected_movie" in res
    assert "recommendations" in res
    assert res["selected_movie"]["title"].lower() == "inception"

    recs = res["recommendations"]
    assert len(recs) == 5

    # Verify recommendations do NOT include the query movie itself
    for rec in recs:
        assert rec["title"].lower() != "inception"
        # Similarity score must be a valid float between 0 and 1
        assert "similarity" in rec
        assert 0.0 <= rec["similarity"] <= 1.0
        assert "similarity_pct" in rec

    # Similarities should be in descending order
    scores = [r["similarity"] for r in recs]
    assert scores == sorted(scores, reverse=True)


def test_unknown_movie_handling(recommender_instance):
    """Test 4: Unknown movie handling raises ValueError with clear message."""
    with pytest.raises(ValueError) as excinfo:
        recommender_instance.recommend("ThisMovieDoesNotExistAnywhereInDataset12345XYZ")
    assert "not found" in str(excinfo.value).lower()


def test_number_of_recommendations(recommender_instance):
    """Test 5: Number of recommendations matches the requested top_n parameter."""
    res_3 = recommender_instance.recommend("The Dark Knight", top_n=3)
    assert len(res_3["recommendations"]) == 3

    res_10 = recommender_instance.recommend("The Dark Knight", top_n=10)
    assert len(res_10["recommendations"]) == 10


def test_missing_data_handling(tmp_path):
    """Test 6: Handling datasets with missing/null attributes gracefully."""
    sample_data = pd.DataFrame([
        {
            "Movie_Title": "Test Movie A",
            "Movie_Genre": None,
            "Movie_Keywords": "space adventure",
            "Movie_Overview": None,
            "Movie_Cast": "Actor One",
            "Movie_Director": None,
            "Movie_Vote": None,
            "Movie_Release_Date": "2020-01-01"
        },
        {
            "Movie_Title": "Test Movie B",
            "Movie_Genre": "Sci-Fi",
            "Movie_Keywords": "space adventure alien",
            "Movie_Overview": "An epic space mission.",
            "Movie_Cast": None,
            "Movie_Director": "Director Two",
            "Movie_Vote": 7.5,
            "Movie_Release_Date": "2021-05-10"
        },
        {
            "Movie_Title": "Test Movie C",
            "Movie_Genre": "Romance",
            "Movie_Keywords": "love wedding couple",
            "Movie_Overview": "A romantic story.",
            "Movie_Cast": "Actor Three",
            "Movie_Director": "Director Three",
            "Movie_Vote": 6.0,
            "Movie_Release_Date": "2019-02-14"
        }
    ])
    csv_file = tmp_path / "mock_movies.csv"
    sample_data.to_csv(csv_file, index=False)

    rec = MovieRecommender(dataset_path=str(csv_file))
    assert rec.is_initialized is True
    assert len(rec.df) == 3

    # Recommending for Movie A should prioritize Movie B over Movie C due to 'space adventure'
    result = rec.recommend("Test Movie A", top_n=2)
    assert result["recommendations"][0]["title"] == "Test Movie B"
    assert result["recommendations"][0]["similarity"] > result["recommendations"][1]["similarity"]
