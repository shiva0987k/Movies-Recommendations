import 'dotenv/config';

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: '2mb' }));

const PORT = Number(process.env.PORT) || 3000;
const FLASK_PORT = Number(process.env.FLASK_PORT) || 5000;

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const OMDB_BASE_URL = 'https://www.omdbapi.com';


// ============================================================
// CACHE
// ============================================================

interface CacheItem {
  timestamp: number;
  data: any;
}

const cache = new Map<string, CacheItem>();

const CACHE_TTL_MS = 30 * 60 * 1000;

function getCached(key: string): any | null {
  const item = cache.get(key);

  if (!item) {
    return null;
  }

  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

function setCached(key: string, data: any): void {
  if (cache.size > 2000) {
    const firstKey = cache.keys().next().value;

    if (firstKey) {
      cache.delete(firstKey);
    }
  }

  cache.set(key, {
    timestamp: Date.now(),
    data
  });
}


// ============================================================
// IMDb CACHE
// ============================================================

interface ImdbResult {
  rating: number | null;
  votes: string | null;
  id: string | null;
}

interface ImdbCacheItem extends ImdbResult {
  timestamp: number;
}

const imdbCache = new Map<string, ImdbCacheItem>();

const IMDB_CACHE_TTL_MS = 24 * 60 * 60 * 1000;


// ============================================================
// IMDb API
// ============================================================

async function fetchRealImdbRating(
  imdbId?: string | null,
  title?: string,
  year?: string
): Promise<ImdbResult> {

  if (!OMDB_API_KEY) {
    return {
      rating: null,
      votes: null,
      id: imdbId || null
    };
  }

  const normalizedTitle = (title || '').trim().toLowerCase();

  const cacheKey = imdbId
    ? `imdb_id_${imdbId}`
    : `imdb_title_${normalizedTitle}_${year || ''}`;

  const cached = imdbCache.get(cacheKey);

  if (
    cached &&
    Date.now() - cached.timestamp < IMDB_CACHE_TTL_MS
  ) {
    return {
      rating: cached.rating,
      votes: cached.votes,
      id: cached.id
    };
  }

  let queryUrl = '';

  if (imdbId && imdbId.startsWith('tt')) {

    queryUrl =
      `${OMDB_BASE_URL}/?i=${encodeURIComponent(imdbId)}` +
      `&apikey=${encodeURIComponent(OMDB_API_KEY)}`;

  } else if (normalizedTitle) {

    const cleanYear =
      year &&
      year !== 'N/A' &&
      /^\d{4}$/.test(year)
        ? `&y=${encodeURIComponent(year)}`
        : '';

    queryUrl =
      `${OMDB_BASE_URL}/?t=${encodeURIComponent(normalizedTitle)}` +
      `${cleanYear}` +
      `&apikey=${encodeURIComponent(OMDB_API_KEY)}`;

  } else {

    return {
      rating: null,
      votes: null,
      id: null
    };
  }

  try {

    const controller = new AbortController();

    const timeoutId = setTimeout(
      () => controller.abort(),
      5000
    );

    const response = await fetch(
      queryUrl,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json'
        }
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {

      const data = await response.json();

      if (
        data &&
        data.Response === 'True' &&
        data.imdbRating &&
        data.imdbRating !== 'N/A'
      ) {

        const parsedRating = Number.parseFloat(
          data.imdbRating
        );

        const result: ImdbResult = {
          rating: Number.isNaN(parsedRating)
            ? null
            : Number(parsedRating.toFixed(1)),
          votes: data.imdbVotes || null,
          id: data.imdbID || imdbId || null
        };

        imdbCache.set(cacheKey, {
          ...result,
          timestamp: Date.now()
        });

        return result;
      }
    }

  } catch (error) {
    console.warn('[IMDb] Request failed');
  }

  const fallback: ImdbResult = {
    rating: null,
    votes: null,
    id: imdbId || null
  };

  imdbCache.set(cacheKey, {
    ...fallback,
    timestamp: Date.now()
  });

  return fallback;
}


// ============================================================
// GENRES
// ============================================================

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
  37: 'Western'

};


// ============================================================
// LANGUAGES
// ============================================================

const LANGUAGE_MAP: Record<
  string,
  {
    name: string;
    cinema: string;
    flag: string;
  }
> = {

  hi: {
    name: 'Hindi',
    cinema: 'Bollywood',
    flag: '🇮🇳'
  },

  te: {
    name: 'Telugu',
    cinema: 'Tollywood',
    flag: '🇮🇳'
  },

  ta: {
    name: 'Tamil',
    cinema: 'Kollywood',
    flag: '🇮🇳'
  },

  ml: {
    name: 'Malayalam',
    cinema: 'Mollywood',
    flag: '🇮🇳'
  },

  kn: {
    name: 'Kannada',
    cinema: 'Sandalwood',
    flag: '🇮🇳'
  },

  bn: {
    name: 'Bengali',
    cinema: 'Bengali Cinema',
    flag: '🇮🇳'
  },

  mr: {
    name: 'Marathi',
    cinema: 'Marathi Cinema',
    flag: '🇮🇳'
  },

  pa: {
    name: 'Punjabi',
    cinema: 'Pollywood',
    flag: '🇮🇳'
  },

  gu: {
    name: 'Gujarati',
    cinema: 'Gujarati Cinema',
    flag: '🇮🇳'
  },

  en: {
    name: 'English',
    cinema: 'Hollywood & International',
    flag: '🇺🇸'
  },

  ko: {
    name: 'Korean',
    cinema: 'Korean Cinema',
    flag: '🇰🇷'
  },

  ja: {
    name: 'Japanese',
    cinema: 'Japanese Cinema & Anime',
    flag: '🇯🇵'
  },

  zh: {
    name: 'Chinese',
    cinema: 'Chinese Cinema',
    flag: '🇨🇳'
  },

  fr: {
    name: 'French',
    cinema: 'French Cinema',
    flag: '🇫🇷'
  },

  es: {
    name: 'Spanish',
    cinema: 'Spanish & Latin Cinema',
    flag: '🇪🇸'
  },

  de: {
    name: 'German',
    cinema: 'German Cinema',
    flag: '🇩🇪'
  },

  it: {
    name: 'Italian',
    cinema: 'Italian Cinema',
    flag: '🇮🇹'
  }

};


// ============================================================
// TMDB FORMATTER
// ============================================================

function formatTmdbMovie(movie: any) {

  const genres = (movie.genre_ids || [])
    .map((id: number) => GENRE_MAP[id])
    .filter(Boolean)
    .join(', ');

  const detailGenres = movie.genres
    ? movie.genres
        .map((genre: any) => genre.name)
        .filter(Boolean)
        .join(', ')
    : '';

  const finalGenres =
    genres ||
    detailGenres ||
    'Feature';

  const languageInfo =
    LANGUAGE_MAP[movie.original_language];

  const cinemaLabel =
    languageInfo
      ? `${languageInfo.name} (${languageInfo.cinema})`
      : (
          movie.original_language
            ? movie.original_language.toUpperCase()
            : 'International'
        );

  let year = 'N/A';

  if (
    movie.release_date &&
    typeof movie.release_date === 'string'
  ) {

    const match =
      movie.release_date.match(
        /\b(19\d{2}|20\d{2})\b/
      );

    if (match) {
      year = match[1];
    }
  }

  const tmdbRating =
    movie.vote_average
      ? Number(movie.vote_average.toFixed(1))
      : 0;

  return {

    id: movie.id,

    title:
      movie.title ||
      movie.name ||
      'Untitled',

    original_title:
      movie.original_title ||
      movie.title ||
      '',

    year,

    release_date:
      movie.release_date || '',

    rating: tmdbRating,

    tmdb_rating:
      tmdbRating > 0
        ? tmdbRating
        : null,

    imdb_rating: null,

    imdb_votes: null,

    imdb_id:
      movie.imdb_id ||
      null,

    vote_count:
      movie.vote_count ||
      0,

    language:
      movie.original_language ||
      'en',

    cinema: cinemaLabel,

    genre: finalGenres,

    genres_list:
      finalGenres
        .split(', ')
        .filter(Boolean),

    overview:
      movie.overview ||
      'No overview available.',

    poster_path:
      movie.poster_path ||
      null,

    backdrop_path:
      movie.backdrop_path ||
      null,

    poster_url:
      movie.poster_path
        ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}`
        : null,

    backdrop_url:
      movie.backdrop_path
        ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`
        : null

  };
}


// ============================================================
// IMDb ENRICHMENT
// ============================================================

async function enrichMoviesWithImdbRatings(
  movies: any[]
) {

  return Promise.all(

    movies.map(async (movie) => {

      const imdb =
        await fetchRealImdbRating(
          movie.imdb_id,
          movie.title,
          movie.year
        );

      return {

        ...movie,

        imdb_rating:
          imdb.rating,

        imdb_votes:
          imdb.votes,

        imdb_id:
          imdb.id ||
          movie.imdb_id ||
          null

      };

    })

  );
}


// ============================================================
// FLASK PROCESS
// ============================================================

let flaskProcess: ChildProcess | null = null;
let isFlaskReady = false;
let isSpawning = false;

function startFlaskServer() {

  if (isSpawning || flaskProcess) {
    return;
  }

  isSpawning = true;

  console.log(
    `[Node] Starting Flask server on port ${FLASK_PORT}`
  );

  const pythonCommand =
    process.env.PYTHON_COMMAND ||
    (
      process.platform === 'win32'
        ? 'python'
        : 'python3'
    );

  const environment = {
    ...process.env,
    FLASK_PORT: String(FLASK_PORT),
    FLASK_DEBUG: '0'
  };

  flaskProcess = spawn(
    pythonCommand,
    ['app.py'],
    {
      cwd: __dirname,
      env: environment,
      stdio: [
        'ignore',
        'pipe',
        'pipe'
      ]
    }
  );

  flaskProcess.stdout?.on(
    'data',
    (data) => {

      const message =
        data.toString().trim();

      console.log(
        `[Flask] ${message}`
      );

      if (
        message.includes('Running on') ||
        message.includes('MovieRecommender engine ready')
      ) {

        isFlaskReady = true;
        isSpawning = false;
      }

    }
  );

  flaskProcess.stderr?.on(
    'data',
    (data) => {

      const message =
        data.toString().trim();

      console.log(
        `[Flask] ${message}`
      );

      if (
        message.includes('Running on') ||
        message.includes('MovieRecommender engine ready')
      ) {

        isFlaskReady = true;
        isSpawning = false;
      }

    }
  );

  flaskProcess.on(
    'error',
    (error) => {

      console.error(
        '[Flask] Failed to start:',
        error.message
      );

      isFlaskReady = false;
      isSpawning = false;
      flaskProcess = null;

    }
  );

  flaskProcess.on(
    'exit',
    (code, signal) => {

      console.warn(
        `[Flask] exited code=${code} signal=${signal}`
      );

      isFlaskReady = false;
      isSpawning = false;
      flaskProcess = null;

    }
  );
}


function ensureFlaskRunning() {

  if (flaskProcess) {
    return;
  }

  const request =
    http.get(
      `http://127.0.0.1:${FLASK_PORT}/api/health`,
      (response) => {

        if (response.statusCode === 200) {

          isFlaskReady = true;
          isSpawning = false;

        } else {

          startFlaskServer();

        }

        response.resume();

      }
    );

  request.on(
    'error',
    () => {

      startFlaskServer();

    }
  );

  request.setTimeout(
    2000,
    () => {

      request.destroy();

      startFlaskServer();

    }
  );
}


// ============================================================
// TMDB
// ============================================================

async function fetchFromTmdb(
  endpoint: string,
  params: Record<string, string> = {}
) {

  if (!TMDB_API_KEY) {

    console.error(
      '[TMDB] TMDB_API_KEY is not configured'
    );

    return null;
  }

  const searchParams =
    new URLSearchParams({
      api_key: TMDB_API_KEY,
      ...params
    });

  const url =
    `${TMDB_BASE_URL}${endpoint}?${searchParams.toString()}`;

  const cached =
    getCached(url);

  if (cached) {
    return cached;
  }

  try {

    const response =
      await fetch(
        url,
        {
          headers: {
            Accept: 'application/json'
          }
        }
      );

    if (!response.ok) {

      console.error(
        `[TMDB] HTTP ${response.status}`
      );

      return null;
    }

    const data =
      await response.json();

    setCached(
      url,
      data
    );

    return data;

  } catch (error: any) {

    console.error(
      '[TMDB] Request failed:',
      error.message
    );

    return null;
  }
}


// ============================================================
// HEALTH
// ============================================================

app.get(
  '/api/health',
  (_req, res) => {

    res.json({

      status: 'healthy',

      flask_connected:
        isFlaskReady,

      tmdb_configured:
        Boolean(TMDB_API_KEY),

      omdb_configured:
        Boolean(OMDB_API_KEY),

      node_version:
        process.version,

      environment:
        process.env.NODE_ENV || 'development'

    });

  }
);


// ============================================================
// GENRES
// ============================================================

app.get(
  '/api/genres',
  (_req, res) => {

    const genres =
      Object.entries(GENRE_MAP)
        .map(
          ([id, name]) => ({
            id: Number(id),
            name
          })
        );

    res.json(genres);

  }
);


// ============================================================
// LANGUAGES
// ============================================================

app.get(
  '/api/languages',
  (_req, res) => {

    const indian =
      Object.entries(LANGUAGE_MAP)
        .filter(
          ([, info]) =>
            info.flag === '🇮🇳'
        )
        .map(
          ([code, info]) => ({
            code,
            ...info
          })
        );

    const international =
      Object.entries(LANGUAGE_MAP)
        .filter(
          ([, info]) =>
            info.flag !== '🇮🇳'
        )
        .map(
          ([code, info]) => ({
            code,
            ...info
          })
        );

    res.json({
      indian,
      international
    });

  }
);


// ============================================================
// SEARCH
// ============================================================

app.get(
  '/api/search',
  async (req, res) => {

    const query =
      String(req.query.q || '').trim();

    if (!query) {

      res.json([]);

      return;
    }

    const page =
      String(req.query.page || '1');

    const limit =
      Math.min(
        Number(req.query.limit) || 12,
        50
      );

    const tmdb =
      await fetchFromTmdb(
        '/search/movie',
        {
          query,
          include_adult: 'false',
          page
        }
      );

    if (
      tmdb &&
      Array.isArray(tmdb.results)
    ) {

      const movies =
        tmdb.results
          .slice(0, limit)
          .map(formatTmdbMovie);

      const enriched =
        await enrichMoviesWithImdbRatings(
          movies
        );

      res.json(enriched);

      return;
    }

    try {

      const response =
        await fetch(
          `http://127.0.0.1:${FLASK_PORT}` +
          `/api/search?q=${encodeURIComponent(query)}` +
          `&limit=${limit}`
        );

      if (response.ok) {

        const data =
          await response.json();

        res.json(data);

        return;
      }

    } catch (error) {

      console.error(
        '[Search] Flask fallback failed'
      );

    }

    res.json([]);

  }
);


// ============================================================
// MOVIE DETAILS
// ============================================================

app.get(
  '/api/movie/:id',
  async (req, res) => {

    const movieId =
      req.params.id;

    if (!movieId) {

      res.status(400).json({
        error: 'Missing movie ID'
      });

      return;
    }

    const movie =
      await fetchFromTmdb(
        `/movie/${movieId}`,
        {
          append_to_response:
            'credits,keywords'
        }
      );

    if (!movie) {

      res.status(404).json({
        error: 'Movie not found'
      });

      return;
    }

    const director =
      (
        movie.credits?.crew || []
      ).find(
        (person: any) =>
          person.job === 'Director'
      );

    const cast =
      (
        movie.credits?.cast || []
      )
        .slice(0, 8)
        .map(
          (person: any) =>
            person.name
        )
        .join(', ');

    const formatted =
      formatTmdbMovie(movie);

    const imdb =
      await fetchRealImdbRating(
        movie.imdb_id,
        movie.title,
        formatted.year
      );

    res.json({

      ...formatted,

      tmdb_rating:
        movie.vote_average
          ? Number(
              movie.vote_average.toFixed(1)
            )
          : null,

      imdb_rating:
        imdb.rating,

      imdb_votes:
        imdb.votes,

      imdb_id:
        imdb.id ||
        movie.imdb_id ||
        null,

      director:
        director?.name ||
        'Unknown',

      cast,

      runtime:
        movie.runtime || 0,

      country:
        movie.production_countries?.[0]?.name ||
        movie.origin_country?.[0] ||
        'Unknown',

      tagline:
        movie.tagline || '',

      budget:
        movie.budget || 0,

      revenue:
        movie.revenue || 0,

      keywords:
        (
          movie.keywords?.keywords || []
        )
          .map(
            (keyword: any) =>
              keyword.name
          )
          .join(', ')

    });

  }
);


// ============================================================
// DISCOVER
// ============================================================

app.get(
  '/api/discover',
  async (req, res) => {

    const genres =
      String(
        req.query.genres || ''
      ).trim();

    const languages =
      String(
        req.query.languages || ''
      ).trim();

    const era =
      String(
        req.query.era ||
        req.query.eras ||
        'any'
      )
        .trim()
        .toLowerCase();

    const experience =
      String(
        req.query.experience ||
        'popular'
      )
        .trim()
        .toLowerCase();

    const runtime =
      String(
        req.query.runtime ||
        'any'
      )
        .trim()
        .toLowerCase();

    const minRating =
      Number(
        req.query.min_rating
      ) || 0;

    const page =
      String(
        req.query.page || '1'
      );

    const limit =
      Math.min(
        Number(req.query.limit) || 20,
        50
      );

    const params: Record<string, string> = {

      include_adult: 'false',

      page,

      'vote_count.gte': '15',

      sort_by: 'popularity.desc'

    };


    // Genres

    if (
      genres &&
      genres !== 'all'
    ) {

      const ids =
        genres
          .split(',')
          .map(
            token => token.trim()
          )
          .map(
            token => {

              const number =
                Number(token);

              if (
                !Number.isNaN(number) &&
                GENRE_MAP[number]
              ) {

                return number;
              }

              const found =
                Object.entries(
                  GENRE_MAP
                ).find(
                  ([, name]) =>
                    name.toLowerCase() ===
                    token.toLowerCase()
                );

              return found
                ? Number(found[0])
                : null;

            }
          )
          .filter(
            (id): id is number =>
              id !== null
          );

      if (ids.length > 0) {

        params.with_genres =
          ids.join('|');

      }

    }


    // Languages

    if (
      languages &&
      languages !== 'any' &&
      languages !== 'all'
    ) {

      params.with_original_language =
        languages
          .split(',')
          .map(
            value => value.trim()
          )
          .filter(Boolean)
          .join('|');

    }


    // Eras

    const eraMap:
      Record<string, [string, string]> = {

        '1930s': [
          '1930-01-01',
          '1939-12-31'
        ],

        '1940s': [
          '1940-01-01',
          '1949-12-31'
        ],

        '1950s': [
          '1950-01-01',
          '1959-12-31'
        ],

        '1960s': [
          '1960-01-01',
          '1969-12-31'
        ],

        '1970s': [
          '1970-01-01',
          '1979-12-31'
        ],

        '1980s': [
          '1980-01-01',
          '1989-12-31'
        ],

        '1990s': [
          '1990-01-01',
          '1999-12-31'
        ],

        '2000s': [
          '2000-01-01',
          '2009-12-31'
        ],

        '2010s': [
          '2010-01-01',
          '2019-12-31'
        ],

        '2020s': [
          '2020-01-01',
          '2029-12-31'
        ]

      };

    const eraTokens =
      era
        .split(',')
        .map(
          value => value.trim()
        );

    const validEras =
      eraTokens.filter(
        value =>
          Boolean(
            eraMap[value]
          )
      );

    if (validEras.length === 1) {

      const selected =
        eraMap[validEras[0]];

      params[
        'primary_release_date.gte'
      ] = selected[0];

      params[
        'primary_release_date.lte'
      ] = selected[1];

    } else if (
      validEras.length > 1
    ) {

      const dates =
        validEras.map(
          value => eraMap[value]
        );

      params[
        'primary_release_date.gte'
      ] =
        dates
          .map(date => date[0])
          .sort()[0];

      params[
        'primary_release_date.lte'
      ] =
        dates
          .map(date => date[1])
          .sort()
          .reverse()[0];

    } else if (
      era === 'surprise'
    ) {

      const eras = [
        '1960s',
        '1970s',
        '1980s',
        '1990s',
        '2000s'
      ];

      const random =
        eras[
          Math.floor(
            Math.random() * eras.length
          )
        ];

      params[
        'primary_release_date.gte'
      ] =
        eraMap[random][0];

      params[
        'primary_release_date.lte'
      ] =
        eraMap[random][1];

    }


    // Runtime

    if (
      runtime === 'under_90'
    ) {

      params[
        'with_runtime.lte'
      ] = '90';

    } else if (
      runtime === '90_120'
    ) {

      params[
        'with_runtime.gte'
      ] = '90';

      params[
        'with_runtime.lte'
      ] = '120';

    } else if (
      runtime === '120_150'
    ) {

      params[
        'with_runtime.gte'
      ] = '120';

      params[
        'with_runtime.lte'
      ] = '150';

    } else if (
      runtime === '150_plus'
    ) {

      params[
        'with_runtime.gte'
      ] = '150';

    }


    // Experience

    switch (experience) {

      case 'highly_rated':
      case 'critically_acclaimed':

        params.sort_by =
          'vote_average.desc';

        params[
          'vote_count.gte'
        ] = '150';

        break;


      case 'recent':
      case 'new':

        params.sort_by =
          'primary_release_date.desc';

        params[
          'primary_release_date.lte'
        ] =
          new Date()
            .toISOString()
            .split('T')[0];

        break;


      case 'classics':

        params.sort_by =
          'vote_average.desc';

        params[
          'primary_release_date.lte'
        ] =
          '1985-12-31';

        break;


      case 'hidden_gems':

        params[
          'vote_average.gte'
        ] = '7.4';

        params[
          'vote_count.gte'
        ] = '30';

        params[
          'vote_count.lte'
        ] = '1500';

        params.sort_by =
          'vote_average.desc';

        break;


      case 'family':
      case 'family_friendly':

        params.with_genres =
          params.with_genres
            ? `${params.with_genres}|10751`
            : '10751';

        params.sort_by =
          'popularity.desc';

        break;


      case 'big_entertainment':

        params.sort_by =
          'revenue.desc';

        break;


      case 'thought_provoking':

        params.with_genres =
          params.with_genres
            ? `${params.with_genres}|18|9648`
            : '18|9648';

        params.sort_by =
          'vote_average.desc';

        break;


      case 'emotional':

        params.with_genres =
          params.with_genres
            ? `${params.with_genres}|18|10749`
            : '18|10749';

        params.sort_by =
          'vote_average.desc';

        break;


      default:

        params.sort_by =
          'popularity.desc';

    }


    const result =
      await fetchFromTmdb(
        '/discover/movie',
        params
      );

    if (
      result &&
      Array.isArray(result.results)
    ) {

      const movies =
        result.results
          .slice(0, limit)
          .map(formatTmdbMovie);

      let enriched =
        await enrichMoviesWithImdbRatings(
          movies
        );

      if (minRating > 0) {

        enriched =
          enriched.filter(
            movie => {

              if (
                movie.imdb_rating !== null
              ) {

                return (
                  movie.imdb_rating >=
                  minRating
                );

              }

              return (
                movie.tmdb_rating !== null &&
                movie.tmdb_rating >=
                minRating
              );

            }
          );

      }

      res.json({

        page:
          result.page || 1,

        total_pages:
          result.total_pages || 1,

        total_results:
          result.total_results || 0,

        results:
          enriched

      });

      return;
    }

    res.json({

      page: 1,

      total_pages: 1,

      total_results: 0,

      results: []

    });

  }
);


// ============================================================
// RECOMMENDATIONS
// ============================================================

app.get(
  '/api/recommend',
  async (req, res) => {

    const movieTitle =
      String(
        req.query.movie || ''
      ).trim();

    const tmdbId =
      req.query.tmdb_id
        ? String(req.query.tmdb_id)
        : null;

    const limit =
      Math.min(
        Number(req.query.limit) || 8,
        20
      );

    if (
      !movieTitle &&
      !tmdbId
    ) {

      res.status(400).json({

        error:
          "Missing required 'movie' or 'tmdb_id' query parameter"

      });

      return;
    }

    try {

      let recommendationResult:
        any = null;


      // Local Flask recommendation

      if (movieTitle) {

        try {

          const response =
            await fetch(
              `http://127.0.0.1:${FLASK_PORT}` +
              `/api/recommend?movie=${encodeURIComponent(movieTitle)}` +
              `&limit=${limit}`
            );

          if (response.ok) {

            recommendationResult =
              await response.json();

          }

        } catch {

          console.warn(
            '[Recommend] Flask unavailable'
          );

        }

      }


      // TMDB fallback

      if (!recommendationResult) {

        let movie: any = null;

        if (tmdbId) {

          movie =
            await fetchFromTmdb(
              `/movie/${tmdbId}`,
              {
                append_to_response:
                  'credits,keywords'
              }
            );

        } else {

          const search =
            await fetchFromTmdb(
              '/search/movie',
              {
                query: movieTitle
              }
            );

          if (
            search?.results?.[0]
          ) {

            movie =
              await fetchFromTmdb(
                `/movie/${search.results[0].id}`,
                {
                  append_to_response:
                    'credits,keywords'
                }
              );

          }

        }


        if (movie) {

          const director =
            (
              movie.credits?.crew || []
            ).find(
              (person: any) =>
                person.job === 'Director'
            );

          const cast =
            (
              movie.credits?.cast || []
            )
              .slice(0, 6)
              .map(
                (person: any) =>
                  person.name
              )
              .join(' ');

          const genres =
            (
              movie.genres || []
            )
              .map(
                (genre: any) =>
                  genre.name
              )
              .join(' ');

          const keywords =
            (
              movie.keywords?.keywords || []
            )
              .map(
                (keyword: any) =>
                  keyword.name
              )
              .join(' ');


          const externalMovie = {

            id:
              movie.id,

            title:
              movie.title,

            genre:
              genres,

            keywords,

            overview:
              movie.overview || '',

            cast,

            director:
              director?.name || '',

            rating:
              movie.vote_average
                ? Number(
                    movie.vote_average.toFixed(1)
                  )
                : 0,

            year:
              movie.release_date
                ? movie.release_date.slice(0, 4)
                : 'N/A',

            poster_url:
              movie.poster_path
                ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}`
                : null,

            backdrop_url:
              movie.backdrop_path
                ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}`
                : null,

            language:
              movie.original_language ||
              'en'

          };


          const flaskResponse =
            await fetch(
              `http://127.0.0.1:${FLASK_PORT}` +
              `/api/external-recommend?limit=${limit}`,
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify(
                    externalMovie
                  )
              }
            );

          if (flaskResponse.ok) {

            recommendationResult =
              await flaskResponse.json();

            recommendationResult.selected_movie =
              externalMovie;

          }

        }

      }


      if (!recommendationResult) {

        res.status(404).json({

          error:
            `Movie '${movieTitle || tmdbId}' not found.`

        });

        return;
      }


      const recommendations =
        await enrichMoviesWithImdbRatings(
          recommendationResult.recommendations || []
        );


      let selectedMovie =
        recommendationResult.selected_movie;


      if (selectedMovie) {

        const enriched =
          await enrichMoviesWithImdbRatings(
            [selectedMovie]
          );

        selectedMovie =
          enriched[0];

      }


      res.json({

        selected_movie:
          selectedMovie,

        recommendations,

        total_candidates:
          recommendationResult.total_candidates,

        engine:
          'TF-IDF + Cosine Similarity (Scikit-Learn)'

      });

    } catch (error) {

      console.error(
        '[Recommend]',
        error
      );

      res.status(500).json({

        error:
          'Failed to compute recommendations.'

      });

    }

  }
);


// ============================================================
// FEATURED
// ============================================================

app.get(
  '/api/featured',
  async (_req, res) => {

    const popular =
      await fetchFromTmdb(
        '/movie/popular',
        {
          page: '1'
        }
      );

    if (
      popular &&
      Array.isArray(popular.results)
    ) {

      const movies =
        popular.results
          .slice(0, 8)
          .map(formatTmdbMovie);

      const enriched =
        await enrichMoviesWithImdbRatings(
          movies
        );

      res.json(enriched);

      return;
    }


    try {

      const response =
        await fetch(
          `http://127.0.0.1:${FLASK_PORT}` +
          `/api/featured?limit=8`
        );

      if (response.ok) {

        const data =
          await response.json();

        res.json(data);

        return;
      }

    } catch {

      console.error(
        '[Featured] Flask failed'
      );

    }

    res.json([]);

  }
);


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (
    error: any,
    _req,
    res,
    _next
  ) => {

    console.error(
      '[Express Error]',
      error
    );

    res.status(500).json({

      error:
        'Internal server error'

    });

  }
);


// ============================================================
// START SERVER
// ============================================================

async function bootstrap() {

  const isProduction =
    process.env.NODE_ENV === 'production';


  if (!isProduction) {

    const vite =
      await createViteServer({

        server: {
          middlewareMode: true
        },

        appType: 'spa'

      });

    app.use(
      vite.middlewares
    );

  } else {

    const distPath =
      path.resolve(
        __dirname,
        'dist'
      );

    app.use(
      express.static(
        distPath
      )
    );

    app.get(
      '*',
      (_req, res) => {

        res.sendFile(
          path.join(
            distPath,
            'index.html'
          )
        );

      }
    );

  }


  app.listen(
    PORT,
    '0.0.0.0',
    () => {

      console.log(
        `[Server] Running on port ${PORT}`
      );

      console.log(
        `[Server] Flask port: ${FLASK_PORT}`
      );

      console.log(
        `[Server] Environment: ${
          process.env.NODE_ENV ||
          'development'
        }`
      );

      if (!TMDB_API_KEY) {

        console.warn(
          '[Warning] TMDB_API_KEY is not configured'
        );

      }

      if (!OMDB_API_KEY) {

        console.warn(
          '[Warning] OMDB_API_KEY is not configured'
        );

      }

      ensureFlaskRunning();

    }
  );

}


bootstrap().catch(
  (error) => {

    console.error(
      '[Server Bootstrap Failed]',
      error
    );

    process.exit(1);

  }
);


// ============================================================
// SHUTDOWN
// ============================================================

function shutdown() {

  console.log(
    '[Server] Shutting down...'
  );

  if (flaskProcess) {

    flaskProcess.kill(
      'SIGTERM'
    );

    flaskProcess = null;

  }

  process.exit(0);

}

process.on(
  'SIGINT',
  shutdown
);

process.on(
  'SIGTERM',
  shutdown
);
