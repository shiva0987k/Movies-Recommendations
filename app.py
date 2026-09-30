"""
Movie Recommendation System - Flask Application Server
Provides RESTful recommendation API and serves the discovery web application.
"""

import os
import logging
from flask import Flask, request, jsonify, render_template, send_from_directory
from recommender import MovieRecommender

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder="templates", static_folder="static")

# Enable simple CORS for all routes
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# Initialize Recommender Engine at startup
recommender: MovieRecommender = None
try:
    logger.info("Initializing MovieRecommender engine...")
    recommender = MovieRecommender(dataset_path="data/movies.csv")
    logger.info("MovieRecommender engine ready with %d movies.", len(recommender.df))
except Exception as e:
    logger.error("Failed to initialize recommender: %s", str(e))


@app.route("/")
def index():
    """Render main movie recommendation homepage."""
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health():
    """Check API and recommender health."""
    if recommender and recommender.is_initialized:
        return jsonify({
            "status": "healthy",
            "movies_count": len(recommender.df),
            "model_ready": True
        })
    return jsonify({
        "status": "degraded",
        "error": "Model not initialized"
    }), 503


@app.route("/api/search", methods=["GET"])
def search_movies():
    """
    Search movies by query.
    GET /api/search?q=<query>&limit=10
    """
    if not recommender or not recommender.is_initialized:
        return jsonify({"error": "Recommendation model is loading, please try again."}), 503

    query = request.args.get("q", "").strip()
    if not query:
        return jsonify([])

    limit = request.args.get("limit", 10, type=int)
    limit = max(1, min(limit, 50))

    try:
        results = recommender.search_movies(query, limit=limit)
        return jsonify(results)
    except Exception as e:
        logger.exception("Search error: %s", str(e))
        return jsonify({"error": "Failed to perform search"}), 500


@app.route("/api/featured", methods=["GET"])
def get_featured():
    """
    Get curated popular / iconic movies for quick exploration.
    GET /api/featured?limit=8
    """
    if not recommender or not recommender.is_initialized:
        return jsonify({"error": "Recommendation model is loading, please try again."}), 503

    limit = request.args.get("limit", 8, type=int)
    limit = max(1, min(limit, 20))

    try:
        featured = recommender.get_featured_movies(limit=limit)
        return jsonify(featured)
    except Exception as e:
        logger.exception("Featured movies error: %s", str(e))
        return jsonify({"error": "Failed to fetch featured movies"}), 500


@app.route("/api/recommend", methods=["GET"])
def recommend():
    """
    Get similar movie recommendations based on a selected movie.
    GET /api/recommend?movie=<movie_title>&limit=8
    """
    if not recommender or not recommender.is_initialized:
        return jsonify({"error": "Recommendation model is loading, please try again."}), 503

    movie_title = request.args.get("movie", "").strip()
    if not movie_title:
        return jsonify({
            "error": "Missing required query parameter: 'movie'"
        }), 400

    limit = request.args.get("limit", 8, type=int)
    limit = max(1, min(limit, 20))

    try:
        result = recommender.recommend(movie_title, top_n=limit)
        return jsonify(result)
    except ValueError as ve:
        return jsonify({
            "error": str(ve)
        }), 404
    except Exception as e:
        logger.exception("Recommendation error: %s", str(e))
        return jsonify({
            "error": "An error occurred while calculating movie recommendations."
        }), 500


@app.route("/api/external-recommend", methods=["POST"])
def external_recommend():
    """
    Calculate content-based recommendations for an external movie object.
    POST /api/external-recommend?limit=8
    """
    if not recommender or not recommender.is_initialized:
        return jsonify({"error": "Recommendation model is loading, please try again."}), 503

    movie_data = request.get_json(silent=True) or {}
    if not movie_data or not movie_data.get("title"):
        return jsonify({"error": "Missing movie data with title"}), 400

    limit = request.args.get("limit", 8, type=int)
    limit = max(1, min(limit, 20))

    try:
        result = recommender.recommend_for_external(movie_data, top_n=limit)
        return jsonify(result)
    except Exception as e:
        logger.exception("External recommendation error: %s", str(e))
        return jsonify({"error": "Failed to calculate recommendations"}), 500


if __name__ == "__main__":
    # Prefer FLASK_PORT, fallback to 5000 (avoid colliding with Cloud Run PORT=8080)
    port = int(os.environ.get("FLASK_PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    logger.info("Starting Flask Movie Recommendation Server on port %d...", port)
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
