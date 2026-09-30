"""
Movie Recommendation System - Flask Backend

Provides:
- Movie search
- Featured movies
- Content-based recommendations
- External movie recommendations
- Health monitoring
"""

import os
import logging

from flask import Flask, request, jsonify

from recommender import MovieRecommender


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

logger = logging.getLogger(__name__)


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)


# ============================================================
# CORS
# ============================================================

@app.after_request
def add_cors_headers(response):

    response.headers["Access-Control-Allow-Origin"] = "*"

    response.headers[
        "Access-Control-Allow-Methods"
    ] = "GET, POST, OPTIONS"

    response.headers[
        "Access-Control-Allow-Headers"
    ] = "Content-Type, Authorization"

    return response


# ============================================================
# RECOMMENDER INITIALIZATION
# ============================================================

recommender = None

try:

    logger.info(
        "Initializing MovieRecommender engine..."
    )

    recommender = MovieRecommender(
        dataset_path="data/movies.csv"
    )

    logger.info(
        "MovieRecommender engine ready with %d movies.",
        len(recommender.df)
    )

except Exception as error:

    logger.exception(
        "Failed to initialize recommender: %s",
        error
    )


# ============================================================
# HEALTH
# ============================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    if (
        recommender is not None and
        recommender.is_initialized
    ):

        return jsonify({

            "status": "healthy",

            "movies_count":
                len(recommender.df),

            "model_ready":
                True

        })


    return jsonify({

        "status": "degraded",

        "model_ready":
            False,

        "error":
            "Recommendation model not initialized"

    }), 503


# ============================================================
# SEARCH
# ============================================================

@app.route(
    "/api/search",
    methods=["GET"]
)
def search_movies():

    if (
        recommender is None or
        not recommender.is_initialized
    ):

        return jsonify({

            "error":
                "Recommendation model is not ready."

        }), 503


    query =
        request.args.get(
            "q",
            ""
        ).strip()


    if not query:

        return jsonify([])


    limit =
        request.args.get(
            "limit",
            10,
            type=int
        )

    limit =
        max(
            1,
            min(limit, 50)
        )


    try:

        results =
            recommender.search_movies(
                query,
                limit=limit
            )

        return jsonify(results)

    except Exception as error:

        logger.exception(
            "Search error: %s",
            error
        )

        return jsonify({

            "error":
                "Failed to perform search"

        }), 500


# ============================================================
# FEATURED
# ============================================================

@app.route(
    "/api/featured",
    methods=["GET"]
)
def get_featured():

    if (
        recommender is None or
        not recommender.is_initialized
    ):

        return jsonify({

            "error":
                "Recommendation model is not ready."

        }), 503


    limit =
        request.args.get(
            "limit",
            8,
            type=int
        )

    limit =
        max(
            1,
            min(limit, 20)
        )


    try:

        results =
            recommender.get_featured_movies(
                limit=limit
            )

        return jsonify(results)

    except Exception as error:

        logger.exception(
            "Featured error: %s",
            error
        )

        return jsonify({

            "error":
                "Failed to fetch featured movies"

        }), 500


# ============================================================
# RECOMMEND
# ============================================================

@app.route(
    "/api/recommend",
    methods=["GET"]
)
def recommend():

    if (
        recommender is None or
        not recommender.is_initialized
    ):

        return jsonify({

            "error":
                "Recommendation model is not ready."

        }), 503


    movie_title =
        request.args.get(
            "movie",
            ""
        ).strip()


    if not movie_title:

        return jsonify({

            "error":
                "Missing required query parameter: movie"

        }), 400


    limit =
        request.args.get(
            "limit",
            8,
            type=int
        )

    limit =
        max(
            1,
            min(limit, 20)
        )


    try:

        result =
            recommender.recommend(
                movie_title,
                top_n=limit
            )

        return jsonify(result)


    except ValueError as error:

        return jsonify({

            "error":
                str(error)

        }), 404


    except Exception as error:

        logger.exception(
            "Recommendation error: %s",
            error
        )

        return jsonify({

            "error":
                "Failed to calculate recommendations."

        }), 500


# ============================================================
# EXTERNAL RECOMMENDATION
# ============================================================

@app.route(
    "/api/external-recommend",
    methods=["POST"]
)
def external_recommend():

    if (
        recommender is None or
        not recommender.is_initialized
    ):

        return jsonify({

            "error":
                "Recommendation model is not ready."

        }), 503


    movie_data =
        request.get_json(
            silent=True
        ) or {}


    if not movie_data.get("title"):

        return jsonify({

            "error":
                "Missing movie data with title"

        }), 400


    limit =
        request.args.get(
            "limit",
            8,
            type=int
        )

    limit =
        max(
            1,
            min(limit, 20)
        )


    try:

        result =
            recommender.recommend_for_external(
                movie_data,
                top_n=limit
            )

        return jsonify(result)


    except Exception as error:

        logger.exception(
            "External recommendation error: %s",
            error
        )

        return jsonify({

            "error":
                "Failed to calculate recommendations"

        }), 500


# ============================================================
# ROOT
# ============================================================

@app.route(
    "/",
    methods=["GET"]
)
def index():

    return jsonify({

        "name":
            "Movie Recommendation API",

        "status":
            "running",

        "endpoints": [

            "/api/health",
            "/api/search",
            "/api/featured",
            "/api/recommend",
            "/api/external-recommend"

        ]

    })


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    port =
        int(
            os.environ.get(
                "FLASK_PORT",
                "5000"
            )
        )

    debug =
        os.environ.get(
            "FLASK_DEBUG",
            "0"
        ) == "1"


    logger.info(
        "Starting Flask server on port %d",
        port
    )


    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )
