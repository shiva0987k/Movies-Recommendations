# Movie Recommendation & Discovery System

A production-grade, content-based movie discovery and recommendation platform built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js/Express**, **Python (Flask)**, and **Scikit-Learn**, powered by the **TMDB Global Movie Database** and a curated dataset of feature films.

---

## 1. Architectural Highlights

- **Preserved Machine Learning Engine**: Genuine **Content-Based Filtering** using Scikit-Learn's `TfidfVectorizer` (sublinear term scaling, unigrams + bigrams) and `cosine_similarity`. No hardcoded recommendations or fabricated similarity values.
- **First-Time User Onboarding**: 7-question taste profile questionnaire ("WHAT DO YOU WANT TO WATCH?") covering Mood/Genres, Cinema & Language (Indian Regional + International), Era (1930s–2020s), Experience Type, Runtime, Minimum Rating, and Companion Context.
- **Personalized Discovery**: Dynamic home sections generated from saved preferences (Recommended For You, Because You Like [Selected Genres], Popular In Your Selection, Highly Rated Picks, Classic Picks, Hidden Gems, Recently Released).
- **Indian Regional Cinema & World Cinema**: First-class support for Hindi (Bollywood), Telugu (Tollywood), Tamil (Kollywood), Malayalam (Mollywood), Kannada (Sandalwood), Bengali, Marathi, Punjabi, Gujarati, alongside English (Hollywood), Korean, Japanese, Chinese, French, Spanish, German, and Italian cinema.
- **Comprehensive Era Coverage**: Search and filter from the 1930s Golden Age through the 2020s contemporary releases.
- **Global Search & Autocomplete**: Real-time debounced title search with poster thumbnails, original titles, languages, and ratings.
- **Interactive Movie Details**: Backdrops, high-resolution posters, runtime, original title, directors, main cast, and the primary `[ Get Recommendations ]` trigger.
- **Local Preference Persistence**: User preferences are saved in `localStorage` and can be adjusted anytime via **My Preferences**.

---

## 2. Machine Learning Pipeline

```text
Selected Movie
      ↓
Metadata Extraction (Genres, Keywords, Overview, Cast, Director)
      ↓
Scikit-Learn TF-IDF Vectorizer (12,000 max features, sublinear TF)
      ↓
Cosine Similarity Calculation: cos(θ) = (A · B) / (||A|| * ||B||)
      ↓
Ranking & Candidate Filtering (Excluding target film)
      ↓
TMDB Poster & Metadata Enrichment
      ↓
Ranked Recommendations with Exact Match Percentage
```

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Web Server & Edge API**: Express, Node.js, `node-fetch`
- **Machine Learning Microservice**: Python 3.10+, Flask, Scikit-Learn, Pandas, NumPy
- **External Data**: TMDB (The Movie Database) API & Image CDN
- **Testing**: Pytest (6 automated test suites)

---

## 4. Project Structure

```text
movie-recommendation-system/
│
├── app.py                     # Flask ML microservice (recommendations & vectorization)
├── recommender.py             # Content-based ML engine (TF-IDF & Cosine Similarity)
├── server.ts                  # Express full-stack proxy & TMDB integration server
├── requirements.txt           # Python dependencies
├── package.json               # Node.js dependencies & scripts
├── README.md                  # System documentation
│
├── data/
│   └── movies.csv             # 4,757 feature films dataset
│
├── src/
│   ├── App.tsx                # Main application state and page coordinator
│   ├── types.ts               # TypeScript data definitions
│   ├── components/
│   │   ├── Navbar.tsx         # 3-Zone Top Bar Contract
│   │   ├── OnboardingModal.tsx# 7-Question preference onboarding
│   │   ├── MovieCard.tsx      # Strict 2:3 poster, unboxed metadata (·), fallback
│   │   ├── MovieDetailsModal.tsx # Backdrops, metadata, [Get Recommendations]
│   │   ├── RecommendationsSection.tsx # "YOU MAY ALSO LIKE" ML section
│   │   └── SearchOverlay.tsx  # Global search modal with live autocomplete
│   └── pages/
│       ├── HomePage.tsx       # Personalized discovery ("YOUR MOVIE PICKS")
│       ├── DiscoverPage.tsx   # Comprehensive catalog filter & browser
│       ├── GenresPage.tsx     # 17 genre category showcases
│       ├── LanguagesPage.tsx  # Indian and International cinema browser
│       ├── PreferencesPage.tsx# View and modify taste preferences
│       └── AboutPage.tsx      # Mathematical & technical walkthrough
│
└── tests/
    └── test_recommender.py    # Automated Pytest suite (6/6 tests passing)
```

---

## 5. Running the Application

### Install Dependencies
```bash
npm install
pip install -r requirements.txt
```

### Start Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`, automatically managing the Python Flask ML process on port `5000`.

---

## 6. Running Unit Tests

Run the test suite to verify the ML pipeline:
```bash
PYTHONPATH=. pytest -v tests/test_recommender.py
```

All 6 test cases verify:
1. `test_dataset_loading`: Ingestion of 4,750+ titles, columns normalization.
2. `test_movie_search`: Exact, prefix, and substring search matching.
3. `test_recommendation_function`: Real mathematical cosine similarity ranking between 0.0 and 1.0.
4. `test_unknown_movie_handling`: Proper exception handling for unrecognized titles.
5. `test_number_of_recommendations`: Verification of requested top-N limit.
6. `test_missing_data_handling`: Resilient handling of missing genres, cast, and overviews.
