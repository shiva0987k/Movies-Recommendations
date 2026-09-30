import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const FLASK_PORT = Number(process.env.FLASK_PORT) || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8265bd1679663a7ea12ac168da84d2e8';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Legitimate IMDb rating source via OMDB
const OMDB_API_KEY = process.env.OMDB_API_KEY || 'trilogy';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// In-memory caches to avoid redundant external network calls
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

const imdbCache = new Map<string, { rating: number | null; votes: string | null; id: string | null; timestamp: number }>();
const IMDB_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function getCached(key: string) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCached(key: string, data: any) {
  if (cache.size > 2000) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { timestamp: Date.now(), data });
}

// Real IMDb Rating Fetcher (NEVER fabricates or copies TMDB ratings)
async function fetchRealImdbRating(
  imdbId?: string | null,
  title?: string,
  year?: string
): Promise<{ rating: number | null; votes: string | null; id: string | null }> {
  const normTitle = (title || '').trim().toLowerCase();
  const cacheKey = imdbId ? `imdb_id_${imdbId}` : `imdb_title_${normTitle}_${year || ''}`;

  const cached = imdbCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < IMDB_CACHE_TTL_MS) {
    return { rating: cached.rating, votes: cached.votes, id: cached.id };
  }

  let queryUrl = '';
  if (imdbId && imdbId.startsWith('tt')) {
    queryUrl = `${OMDB_BASE_URL}/?i=${imdbId}&apikey=${OMDB_API_KEY}`;
  } else if (normTitle) {
    const cleanYear = year && year !== 'N/A' && /^\d{4}$/.test(year) ? `&y=${year}` : '';
    queryUrl = `${OMDB_BASE_URL}/?t=${encodeURIComponent(normTitle)}${cleanYear}&apikey=${OMDB_API_KEY}`;
  } else {
    return { rating: null, votes: null, id: null };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(queryUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.Response === 'True' && data.imdbRating && data.imdbRating !== 'N/A') {
        const parsed = parseFloat(data.imdbRating);
        const result = {
          rating: isNaN(parsed) ? null : Number(parsed.toFixed(1)),
          votes: data.imdbVotes || null,
          id: data.imdbID || imdbId || null,
        };
        imdbCache.set(cacheKey, { ...result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (err: any) {
    // Gracefully handle network timeouts
  }

  // Unavailable in legitimate source - do NOT fake or substitute
  const fallback = { rating: null, votes: null, id: imdbId || null };
  imdbCache.set(cacheKey, { ...fallback, timestamp: Date.now() });
  return fallback;
}

// Genre ID dictionary
const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Cinema / Language display dictionary
const LANGUAGE_MAP: Record<string, { name: string; cinema: string; flag: string }> = {
  hi: { name: 'Hindi', cinema: 'Bollywood', flag: '🇮🇳' },
  te: { name: 'Telugu', cinema: 'Tollywood', flag: '🇮🇳' },
  ta: { name: 'Tamil', cinema: 'Kollywood', flag: '🇮🇳' },
  ml: { name: 'Malayalam', cinema: 'Mollywood', flag: '🇮🇳' },
  kn: { name: 'Kannada', cinema: 'Sandalwood', flag: '🇮🇳' },
  bn: { name: 'Bengali', cinema: 'Bengali Cinema', flag: '🇮🇳' },
  mr: { name: 'Marathi', cinema: 'Marathi Cinema', flag: '🇮🇳' },
  pa: { name: 'Punjabi', cinema: 'Pollywood', flag: '🇮🇳' },
  gu: { name: 'Gujarati', cinema: 'Gujarati Cinema', flag: '🇮🇳' },
  en: { name: 'English', cinema: 'Hollywood & International', flag: '🇺🇸' },
  ko: { name: 'Korean', cinema: 'Korean Cinema (Hallyu)', flag: '🇰🇷' },
  ja: { name: 'Japanese', cinema: 'Japanese Cinema & Anime', flag: '🇯🇵' },
  zh: { name: 'Chinese', cinema: 'Chinese Cinema', flag: '🇨🇳' },
  fr: { name: 'French', cinema: 'French Cinema', flag: '🇫🇷' },
  es: { name: 'Spanish', cinema: 'Spanish & Latin Cinema', flag: '🇪🇸' },
  de: { name: 'German', cinema: 'German Cinema', flag: '🇩🇪' },
  it: { name: 'Italian', cinema: 'Italian Cinema', flag: '🇮🇹' },
};

function formatTmdbMovie(m: any) {
  const genres = (m.genre_ids || [])
    .map((gid: number) => GENRE_MAP[gid])
    .filter(Boolean)
    .join(', ') || (m.genres ? m.genres.map((g: any) => g.name).join(', ') : 'Feature');

  const langInfo = LANGUAGE_MAP[m.original_language];
  const cinemaLabel = langInfo ? `${langInfo.name} (${langInfo.cinema})` : (m.original_language ? m.original_language.toUpperCase() : 'International');

  let year = 'N/A';
  if (m.release_date && typeof m.release_date === 'string') {
    const matched = m.release_date.match(/\b(19\d{2}|20\d{2})\b/);
    if (matched) year = matched[1];
  }

  const tmdbScore = m.vote_average ? Number(m.vote_average.toFixed(1)) : 0.0;

  return {
    id: m.id,
    title: m.title || m.name || 'Untitled',
    original_title: m.original_title || m.title || '',
    year,
    release_date: m.release_date || '',
    rating: tmdbScore,
    tmdb_rating: tmdbScore > 0 ? tmdbScore : null,
    imdb_rating: null as number | null, // Populated by real IMDb enrichment
    imdb_votes: null as string | null,
    imdb_id: m.imdb_id || null,
    vote_count: m.vote_count || 0,
    language: m.original_language || 'en',
    cinema: cinemaLabel,
    genre: genres,
    genres_list: genres.split(', ').filter(Boolean),
    overview: m.overview || 'No overview available.',
    poster_path: m.poster_path || null,
    backdrop_path: m.backdrop_path || null,
    poster_url: m.poster_path ? `${TMDB_IMAGE_BASE}/w500${m.poster_path}` : null,
    backdrop_url: m.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${m.backdrop_path}` : null,
  };
}

// Batch enrich movies with genuine IMDb ratings
async function enrichMoviesWithImdbRatings(movies: any[]) {
  return Promise.all(
    movies.map(async (m) => {
      // If already populated, return
      if (m.imdb_rating !== null && m.imdb_rating !== undefined) {
        return m;
      }
      const imdbData = await fetchRealImdbRating(m.imdb_id, m.title, m.year);
      return {
        ...m,
        imdb_rating: imdbData.rating,
        imdb_votes: imdbData.votes,
        imdb_id: imdbData.id || m.imdb_id || null,
      };
    })
  );
}

let flaskProcess: ChildProcess | null = null;
let isFlaskReady = false;
let isSpawning = false;

function startFlaskServer() {
  if (isSpawning) return;
  isSpawning = true;
  console.log(`[FullStack] Spawning Python Flask server on port ${FLASK_PORT}...`);
  const env = { ...process.env, FLASK_PORT: String(FLASK_PORT), FLASK_DEBUG: '0' };

  flaskProcess = spawn('python3', ['app.py'], {
    cwd: __dirname,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  flaskProcess.stdout?.on('data', (data) => {
    const msg = data.toString();
    console.log(`[Flask stdout] ${msg.trim()}`);
    if (msg.includes('Running on') || msg.includes('MovieRecommender engine ready')) {
      isFlaskReady = true;
      isSpawning = false;
    }
  });

  flaskProcess.stderr?.on('data', (data) => {
    const msg = data.toString();
    console.log(`[Flask stderr] ${msg.trim()}`);
    if (msg.includes('Running on') || msg.includes('MovieRecommender engine ready')) {
      isFlaskReady = true;
      isSpawning = false;
    }
  });

  flaskProcess.on('exit', (code, signal) => {
    console.warn(`[Flask] Process exited with code ${code}, signal ${signal}.`);
    isFlaskReady = false;
    isSpawning = false;
    flaskProcess = null;
    setTimeout(ensureFlaskRunning, 1000);
  });
}

function ensureFlaskRunning() {
  const req = http.get(`http://127.0.0.1:${FLASK_PORT}/api/health`, (res) => {
    if (res.statusCode === 200) {
      isFlaskReady = true;
      isSpawning = false;
    } else {
      startFlaskServer();
    }
  });

  req.on('error', () => {
    startFlaskServer();
  });
}

setInterval(ensureFlaskRunning, 5000);
ensureFlaskRunning();

// Helper to query TMDB securely with caching
async function fetchFromTmdb(endpoint: string, params: Record<string, string> = {}) {
  const urlParams = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...params
  });
  const fullUrl = `${TMDB_BASE_URL}${endpoint}?${urlParams.toString()}`;
  const cacheKey = fullUrl;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(fullUrl, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[TMDB API Error] ${res.status} on ${endpoint}:`, errText);
      return null;
    }
    const data = await res.json();
    setCached(cacheKey, data);
    return data;
  } catch (err: any) {
    console.error(`[TMDB Fetch Exception] on ${endpoint}:`, err.message);
    return null;
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Health Endpoint
app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'healthy',
    flask_connected: isFlaskReady,
    tmdb_configured: Boolean(TMDB_API_KEY),
    omdb_configured: Boolean(OMDB_API_KEY),
  });
});

// 2. Genres Metadata
app.get('/api/genres', (_req, res) => {
  const genresList = Object.entries(GENRE_MAP).map(([id, name]) => ({
    id: Number(id),
    name
  }));
  res.json(genresList);
});

// 3. Languages & Cinemas Metadata
app.get('/api/languages', (_req, res) => {
  const indianCinemas = Object.entries(LANGUAGE_MAP)
    .filter(([_, info]) => info.flag === '🇮🇳')
    .map(([code, info]) => ({ code, ...info }));

  const internationalCinemas = Object.entries(LANGUAGE_MAP)
    .filter(([_, info]) => info.flag !== '🇮🇳')
    .map(([code, info]) => ({ code, ...info }));

  res.json({
    indian: indianCinemas,
    international: internationalCinemas
  });
});

// 4. Movie Search with TMDB & Real IMDb Ratings
app.get('/api/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    res.json([]);
    return;
  }

  const page = String(req.query.page || '1');
  const limit = Math.min(Number(req.query.limit) || 12, 50);

  // Search TMDB API
  const tmdbData = await fetchFromTmdb('/search/movie', {
    query,
    include_adult: 'false',
    page
  });

  if (tmdbData && Array.isArray(tmdbData.results) && tmdbData.results.length > 0) {
    const formatted = tmdbData.results.slice(0, limit).map(formatTmdbMovie);
    const enrichedWithImdb = await enrichMoviesWithImdbRatings(formatted);
    res.json(enrichedWithImdb);
    return;
  }

  // Fallback to Flask local dataset search
  try {
    const flaskRes = await fetch(`http://127.0.0.1:${FLASK_PORT}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (flaskRes.ok) {
      const list = await flaskRes.json();
      const enrichedWithImdb = await enrichMoviesWithImdbRatings(list);
      res.json(enrichedWithImdb);
      return;
    }
  } catch (err) {
    console.error('[Search Flask Fallback Error]:', err);
  }

  res.json([]);
});

// 5. Detailed Movie Lookup with Verified IMDb Rating
app.get('/api/movie/:id', async (req, res) => {
  const movieId = req.params.id;
  if (!movieId) {
    res.status(400).json({ error: 'Missing movie ID' });
    return;
  }

  const tmdbMovie = await fetchFromTmdb(`/movie/${movieId}`, {
    append_to_response: 'credits,keywords'
  });

  if (tmdbMovie) {
    const directorObj = (tmdbMovie.credits?.crew || []).find((c: any) => c.job === 'Director');
    const mainCast = (tmdbMovie.credits?.cast || [])
      .slice(0, 8)
      .map((c: any) => c.name)
      .join(', ');

    const formatted = formatTmdbMovie(tmdbMovie);

    // Fetch REAL IMDb rating from OMDB using tmdbMovie.imdb_id or title
    const imdbInfo = await fetchRealImdbRating(tmdbMovie.imdb_id, tmdbMovie.title, formatted.year);

    res.json({
      ...formatted,
      tmdb_rating: tmdbMovie.vote_average ? Number(tmdbMovie.vote_average.toFixed(1)) : null,
      imdb_rating: imdbInfo.rating, // Real IMDb rating from OMDB (or null if unavailable)
      imdb_votes: imdbInfo.votes,
      imdb_id: imdbInfo.id || tmdbMovie.imdb_id || null,
      director: directorObj ? directorObj.name : 'Unknown',
      cast: mainCast,
      runtime: tmdbMovie.runtime || 0,
      country: tmdbMovie.production_countries?.[0]?.name || tmdbMovie.origin_country?.[0] || 'Unknown',
      tagline: tmdbMovie.tagline || '',
      budget: tmdbMovie.budget || 0,
      revenue: tmdbMovie.revenue || 0,
      keywords: (tmdbMovie.keywords?.keywords || []).map((k: any) => k.name).join(', ')
    });
    return;
  }

  res.status(404).json({ error: 'Movie not found' });
});

// 6. Discover & Filter Movies with Multi-Era & Real IMDb Filtering
app.get('/api/discover', async (req, res) => {
  const genres = String(req.query.genres || '').trim();
  const languages = String(req.query.languages || '').trim();
  const eraParam = String(req.query.era || req.query.eras || 'any').trim().toLowerCase();
  const experience = String(req.query.experience || 'popular').trim().toLowerCase();
  const runtime = String(req.query.runtime || 'any').trim().toLowerCase();
  const minRating = Number(req.query.min_rating) || 0;
  const page = String(req.query.page || '1');
  const customSort = req.query.sort_by ? String(req.query.sort_by) : null;
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const params: Record<string, string> = {
    include_adult: 'false',
    page,
    'vote_count.gte': '15'
  };

  // 1. Genres mapping
  if (genres && genres !== 'all') {
    const genreTokens = genres.split(',').map(t => t.trim());
    const genreIds: number[] = [];
    for (const token of genreTokens) {
      const num = Number(token);
      if (!isNaN(num) && GENRE_MAP[num]) {
        genreIds.push(num);
      } else {
        const found = Object.entries(GENRE_MAP).find(([_, name]) => name.toLowerCase() === token.toLowerCase());
        if (found) genreIds.push(Number(found[0]));
      }
    }
    if (genreIds.length > 0) {
      params.with_genres = genreIds.join('|');
    }
  }

  // 2. Languages mapping
  if (languages && languages !== 'any' && languages !== 'all') {
    const langTokens = languages.split(',').map(l => l.trim().toLowerCase());
    params.with_original_language = langTokens.join('|');
  }

  // 3. Era mapping (supports multi-era or single era: 1930s..2020s)
  const eraTokens = eraParam.split(',').map(e => e.trim());
  const eraMap: Record<string, [string, string]> = {
    '1930s': ['1930-01-01', '1939-12-31'],
    '1940s': ['1940-01-01', '1949-12-31'],
    '1950s': ['1950-01-01', '1959-12-31'],
    '1960s': ['1960-01-01', '1969-12-31'],
    '1970s': ['1970-01-01', '1979-12-31'],
    '1980s': ['1980-01-01', '1989-12-31'],
    '1990s': ['1990-01-01', '1999-12-31'],
    '2000s': ['2000-01-01', '2009-12-31'],
    '2010s': ['2010-01-01', '2019-12-31'],
    '2020s': ['2020-01-01', '2029-12-31'],
  };

  const validEras = eraTokens.filter(e => eraMap[e]);
  if (validEras.length === 1) {
    const chosen = validEras[0];
    params['primary_release_date.gte'] = eraMap[chosen][0];
    params['primary_release_date.lte'] = eraMap[chosen][1];
    params['vote_count.gte'] = '5';
  } else if (validEras.length > 1) {
    // Range spanning from earliest era to latest era
    let minDate = '2099-12-31';
    let maxDate = '1900-01-01';
    for (const e of validEras) {
      if (eraMap[e][0] < minDate) minDate = eraMap[e][0];
      if (eraMap[e][1] > maxDate) maxDate = eraMap[e][1];
    }
    params['primary_release_date.gte'] = minDate;
    params['primary_release_date.lte'] = maxDate;
    params['vote_count.gte'] = '5';
  } else if (eraParam === 'surprise') {
    const randomDecades = ['1960s', '1970s', '1980s', '1990s', '2000s'];
    const chosen = randomDecades[Math.floor(Math.random() * randomDecades.length)];
    params['primary_release_date.gte'] = eraMap[chosen][0];
    params['primary_release_date.lte'] = eraMap[chosen][1];
  }

  // 4. Runtime filter
  if (runtime === 'under_90') {
    params['with_runtime.lte'] = '90';
  } else if (runtime === '90_120') {
    params['with_runtime.gte'] = '90';
    params['with_runtime.lte'] = '120';
  } else if (runtime === '120_150') {
    params['with_runtime.gte'] = '120';
    params['with_runtime.lte'] = '150';
  } else if (runtime === '150_plus') {
    params['with_runtime.gte'] = '150';
  }

  // 5. Experience & Sorting
  if (customSort) {
    params.sort_by = customSort;
  } else {
    switch (experience) {
      case 'highly_rated':
      case 'critically_acclaimed':
        params.sort_by = 'vote_average.desc';
        params['vote_count.gte'] = '150';
        break;
      case 'recent':
      case 'new':
        params.sort_by = 'primary_release_date.desc';
        params['primary_release_date.lte'] = new Date().toISOString().split('T')[0];
        params['vote_count.gte'] = '10';
        break;
      case 'classics':
        params.sort_by = 'vote_average.desc';
        params['primary_release_date.lte'] = '1985-12-31';
        params['vote_count.gte'] = '40';
        break;
      case 'hidden_gems':
        params['vote_average.gte'] = '7.4';
        params['vote_count.gte'] = '30';
        params['vote_count.lte'] = '1500';
        params.sort_by = 'vote_average.desc';
        break;
      case 'family_friendly':
      case 'family':
        params.with_genres = params.with_genres ? `${params.with_genres}|10751` : '10751';
        params.sort_by = 'popularity.desc';
        break;
      case 'big_entertainment':
        params.sort_by = 'revenue.desc';
        break;
      case 'thought_provoking':
        params.with_genres = params.with_genres ? `${params.with_genres}|18|9648` : '18|9648';
        params.sort_by = 'vote_average.desc';
        break;
      case 'emotional':
        params.with_genres = params.with_genres ? `${params.with_genres}|18|10749` : '18|10749';
        params.sort_by = 'vote_average.desc';
        break;
      case 'popular':
      default:
        params.sort_by = 'popularity.desc';
        break;
    }
  }

  const tmdbRes = await fetchFromTmdb('/discover/movie', params);
  if (tmdbRes && Array.isArray(tmdbRes.results)) {
    const formatted = tmdbRes.results.slice(0, limit).map(formatTmdbMovie);

    // Enrich with authentic IMDb ratings
    let enriched = await enrichMoviesWithImdbRatings(formatted);

    // Apply strict IMDb rating filter if user requested e.g. 7+, 8+, 9+
    if (minRating > 0) {
      enriched = enriched.filter((m) => {
        // If real IMDb rating is available, enforce it strictly
        if (m.imdb_rating !== null && m.imdb_rating !== undefined) {
          return m.imdb_rating >= minRating;
        }
        // If IMDb rating is unavailable, keep only if TMDB rating passes threshold
        return m.rating >= minRating;
      });
    }

    res.json({
      page: tmdbRes.page,
      total_pages: tmdbRes.total_pages,
      total_results: tmdbRes.total_results,
      results: enriched
    });
    return;
  }

  res.json({ page: 1, total_pages: 1, total_results: 0, results: [] });
});

// Helper: Enrich recommendations with real TMDB posters & IMDb ratings
async function enrichWithTmdbPostersAndImdb(movies: any[]) {
  return Promise.all(
    movies.map(async (m) => {
      let poster_url = null;
      let backdrop_url = null;
      let language = m.language || 'en';
      let imdb_id = m.imdb_id || null;

      // 1. Try search if we don't have poster
      const cacheKey = `poster_${m.title}_${m.year}`;
      const cached = getCached(cacheKey);

      if (cached) {
        poster_url = cached.poster_url;
        backdrop_url = cached.backdrop_url;
        language = cached.language || language;
        imdb_id = cached.imdb_id || imdb_id;
      } else {
        const searchRes = await fetchFromTmdb('/search/movie', {
          query: m.title,
          year: m.year && m.year !== 'N/A' ? m.year : ''
        });

        if (searchRes && searchRes.results?.[0]) {
          const hit = searchRes.results[0];
          if (hit.poster_path) poster_url = `${TMDB_IMAGE_BASE}/w500${hit.poster_path}`;
          if (hit.backdrop_path) backdrop_url = `${TMDB_IMAGE_BASE}/w1280${hit.backdrop_path}`;
          if (hit.original_language) language = hit.original_language;
          setCached(cacheKey, { poster_url, backdrop_url, language, imdb_id });
        }
      }

      // Fetch authentic IMDb rating
      const imdbData = await fetchRealImdbRating(imdb_id, m.title, m.year);

      const langInfo = LANGUAGE_MAP[language];
      const cinemaLabel = langInfo ? `${langInfo.name} (${langInfo.cinema})` : language.toUpperCase();

      return {
        ...m,
        poster_url: poster_url || m.poster_url || null,
        backdrop_url: backdrop_url || m.backdrop_url || null,
        imdb_rating: imdbData.rating,
        imdb_votes: imdbData.votes,
        imdb_id: imdbData.id || imdb_id,
        language,
        cinema: cinemaLabel
      };
    })
  );
}

// 7. Core Recommendation Engine (Preserves Scikit-Learn TF-IDF + Cosine Similarity)
app.get('/api/recommend', async (req, res) => {
  const movieTitle = String(req.query.movie || '').trim();
  const tmdbId = req.query.tmdb_id ? String(req.query.tmdb_id) : null;
  const limit = Number(req.query.limit) || 8;

  if (!movieTitle && !tmdbId) {
    res.status(400).json({ error: "Missing required 'movie' or 'tmdb_id' query parameter" });
    return;
  }

  try {
    let recommendationResult: any = null;

    // Strategy A: If movie title provided, try native Python recommender first
    if (movieTitle) {
      try {
        const flaskRes = await fetch(`http://127.0.0.1:${FLASK_PORT}/api/recommend?movie=${encodeURIComponent(movieTitle)}&limit=${limit}`);
        if (flaskRes.ok) {
          recommendationResult = await flaskRes.json();
        }
      } catch (err) {
        console.warn('[Flask Local Recommend Failed]:', err);
      }
    }

    // Strategy B: If not in local dataset or tmdbId given, fetch full metadata from TMDB and vectorize!
    if (!recommendationResult) {
      let tmdbData: any = null;
      if (tmdbId) {
        tmdbData = await fetchFromTmdb(`/movie/${tmdbId}`, { append_to_response: 'credits,keywords' });
      } else if (movieTitle) {
        const searchHit = await fetchFromTmdb('/search/movie', { query: movieTitle });
        if (searchHit && searchHit.results?.[0]) {
          tmdbData = await fetchFromTmdb(`/movie/${searchHit.results[0].id}`, { append_to_response: 'credits,keywords' });
        }
      }

      if (tmdbData) {
        const directorObj = (tmdbData.credits?.crew || []).find((c: any) => c.job === 'Director');
        const mainCast = (tmdbData.credits?.cast || []).slice(0, 6).map((c: any) => c.name).join(' ');
        const keywords = (tmdbData.keywords?.keywords || []).map((k: any) => k.name).join(' ');
        const genres = (tmdbData.genres || []).map((g: any) => g.name).join(' ');

        const externalPayload = {
          id: tmdbData.id,
          title: tmdbData.title,
          genre: genres,
          keywords,
          overview: tmdbData.overview || '',
          cast: mainCast,
          director: directorObj ? directorObj.name : '',
          rating: tmdbData.vote_average ? Number(tmdbData.vote_average.toFixed(1)) : 0,
          year: tmdbData.release_date ? tmdbData.release_date.slice(0, 4) : 'N/A',
          poster_url: tmdbData.poster_path ? `${TMDB_IMAGE_BASE}/w500${tmdbData.poster_path}` : null,
          backdrop_url: tmdbData.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${tmdbData.backdrop_path}` : null,
          language: tmdbData.original_language || 'en'
        };

        // Pass external movie to Flask for mathematical TF-IDF vectorization and cosine similarity
        const flaskPost = await fetch(`http://127.0.0.1:${FLASK_PORT}/api/external-recommend?limit=${limit}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(externalPayload)
        });

        if (flaskPost.ok) {
          recommendationResult = await flaskPost.json();
          recommendationResult.selected_movie = externalPayload;
        }
      }
    }

    if (!recommendationResult) {
      res.status(404).json({ error: `Movie '${movieTitle || tmdbId}' not found.` });
      return;
    }

    // Enrich recommendations with genuine TMDB posters and real IMDb ratings
    const enrichedRecs = await enrichWithTmdbPostersAndImdb(recommendationResult.recommendations || []);
    let enrichedSelected = recommendationResult.selected_movie;

    if (enrichedSelected) {
      const selectedEnrichedList = await enrichWithTmdbPostersAndImdb([enrichedSelected]);
      enrichedSelected = selectedEnrichedList[0];
    }

    res.json({
      selected_movie: enrichedSelected,
      recommendations: enrichedRecs,
      total_candidates: recommendationResult.total_candidates,
      engine: 'TF-IDF + Cosine Similarity (Scikit-Learn)'
    });
  } catch (err: any) {
    console.error('[Recommendation Route Error]:', err);
    res.status(500).json({ error: 'Failed to compute recommendations.' });
  }
});

// 8. Featured Movies Endpoint with Real IMDb Ratings
app.get('/api/featured', async (_req, res) => {
  const tmdbPopular = await fetchFromTmdb('/movie/popular', { page: '1' });
  if (tmdbPopular && Array.isArray(tmdbPopular.results)) {
    const formatted = tmdbPopular.results.slice(0, 8).map(formatTmdbMovie);
    const enriched = await enrichMoviesWithImdbRatings(formatted);
    res.json(enriched);
    return;
  }

  try {
    const flaskRes = await fetch(`http://127.0.0.1:${FLASK_PORT}/api/featured?limit=8`);
    if (flaskRes.ok) {
      const data = await flaskRes.json();
      const enriched = await enrichWithTmdbPostersAndImdb(data);
      res.json(enriched);
      return;
    }
  } catch (err) {
    console.error('[Featured Flask Error]:', err);
  }

  res.json([]);
});

// Setup Vite or Static File Serving
async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Web application running at http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server Bootstrap Failed]:', err);
});
