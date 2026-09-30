/**
 * Movie Recommendation System - Vanilla JavaScript Client
 * Communicates with Flask ML recommendation API dynamically.
 */

let searchDebounceTimer = null;
let currentSelectedMovie = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initSearchInput();
  loadFeaturedMovies();
});

/**
 * Fetch and display initial popular / example movies.
 */
async function loadFeaturedMovies() {
  const grid = document.getElementById('featured-grid');
  try {
    const res = await fetch('/api/featured?limit=8');
    if (!res.ok) throw new Error('Failed to fetch featured movies');
    const movies = await res.json();
    renderMovieGrid(grid, movies, false);
  } catch (err) {
    grid.innerHTML = `
      <div class="grid-loading">
        <p>Could not load featured movies catalog.</p>
        <button class="btn-primary" style="margin-top:1rem;" onclick="loadFeaturedMovies()">Retry</button>
      </div>
    `;
  }
}

/**
 * Configure search input with debounced autocomplete and keyboard support.
 */
function initSearchInput() {
  const input = document.getElementById('movie-input');
  const dropdown = document.getElementById('autocomplete-list');
  const clearBtn = document.getElementById('clear-search-btn');

  if (!input) return;

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }

    clearTimeout(searchDebounceTimer);
    if (query.length < 2) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      return;
    }

    searchDebounceTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 250);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      dropdown.classList.add('hidden');
    }
  });

  // Handle keyboard events (Escape to close dropdown)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
    }
  });
}

/**
 * Clear the search box.
 */
function clearSearchInput() {
  const input = document.getElementById('movie-input');
  const clearBtn = document.getElementById('clear-search-btn');
  const dropdown = document.getElementById('autocomplete-list');
  input.value = '';
  clearBtn.classList.add('hidden');
  dropdown.classList.add('hidden');
  input.focus();
}

/**
 * Fetch autocomplete suggestions from backend API.
 */
async function fetchSuggestions(query) {
  const dropdown = document.getElementById('autocomplete-list');
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
    if (!res.ok) return;
    const matches = await res.json();

    if (!matches || matches.length === 0) {
      dropdown.innerHTML = `
        <div class="autocomplete-item" style="cursor: default; opacity: 0.7;">
          <span class="item-title">No movies found matching "${escapeHtml(query)}"</span>
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = matches.map(movie => `
      <div class="autocomplete-item" onclick="selectMovieByTitle('${escapeJsString(movie.title)}')">
        <div>
          <div class="item-title">${escapeHtml(movie.title)}</div>
          <div class="item-meta">${escapeHtml(movie.genre.split(' ').slice(0, 2).join(', '))} &bull; ${escapeHtml(movie.year)}</div>
        </div>
        <span class="badge badge-rating">&#9733; ${movie.rating}</span>
      </div>
    `).join('');
    dropdown.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to fetch suggestions:', err);
  }
}

/**
 * Form submit handler.
 */
function handleSearchSubmit() {
  const input = document.getElementById('movie-input');
  const title = input.value.trim();
  if (!title) {
    showStatus('Please enter a movie title to search.', 'error');
    return;
  }
  const dropdown = document.getElementById('autocomplete-list');
  dropdown.classList.add('hidden');
  selectMovieByTitle(title);
}

/**
 * Called when changing recommendation limit dropdown.
 */
function handleLimitChange() {
  if (currentSelectedMovie) {
    selectMovieByTitle(currentSelectedMovie);
  }
}

/**
 * Select a movie by title and request ML recommendations.
 */
async function selectMovieByTitle(title) {
  if (!title) return;
  currentSelectedMovie = title;

  // Sync search input
  const input = document.getElementById('movie-input');
  if (input) input.value = title;
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.classList.remove('hidden');

  const dropdown = document.getElementById('autocomplete-list');
  if (dropdown) dropdown.classList.add('hidden');

  const limitSelect = document.getElementById('rec-limit-select');
  const limit = limitSelect ? limitSelect.value : 8;

  showStatus(`Calculating content-based recommendations for "${title}" using TF-IDF and Cosine Similarity...`, 'loading');

  const selectedSection = document.getElementById('selected-movie-section');
  const recSection = document.getElementById('recommendations-section');
  const recGrid = document.getElementById('recommendations-grid');

  try {
    const res = await fetch(`/api/recommend?movie=${encodeURIComponent(title)}&limit=${limit}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch recommendations');
    }

    hideStatus();

    // Render Selected Movie Card
    renderSelectedMovie(data.selected_movie);
    selectedSection.classList.remove('hidden');

    // Render Recommendations Grid
    renderMovieGrid(recGrid, data.recommendations, true);
    recSection.classList.remove('hidden');

    // Smooth scroll to selected movie section
    selectedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    showStatus(err.message, 'error');
    recSection.classList.add('hidden');
  }
}

/**
 * Render the main selected movie card.
 */
function renderSelectedMovie(movie) {
  const container = document.getElementById('selected-movie-card');
  if (!container) return;

  const genres = movie.genre.split(' ').filter(Boolean);

  container.innerHTML = `
    <div class="selected-poster-wrap">
      <div class="selected-poster-fallback">
        <svg class="fallback-film-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="7" x2="7" y2="7"></line>
          <line x1="2" y1="17" x2="7" y2="17"></line>
          <line x1="17" y1="17" x2="22" y2="17"></line>
          <line x1="17" y1="7" x2="22" y2="7"></line>
        </svg>
        <span class="fallback-title">${escapeHtml(movie.title)}</span>
      </div>
    </div>
    <div class="selected-details">
      <div class="selected-title-row">
        <h2 class="selected-movie-title">${escapeHtml(movie.title)}</h2>
        <span class="selected-year">(${escapeHtml(movie.year)})</span>
      </div>

      <div class="selected-badges">
        <span class="badge badge-rating">&#9733; ${movie.rating > 0 ? movie.rating : 'N/A'}</span>
        ${genres.map(g => `<span class="badge badge-genre">${escapeHtml(g)}</span>`).join('')}
      </div>

      <div class="selected-meta-row">
        <div>
          <div class="meta-field-label">Director</div>
          <div class="meta-field-value" title="${escapeHtml(movie.director)}">${escapeHtml(movie.director || 'Unknown')}</div>
        </div>
        <div>
          <div class="meta-field-label">Primary Cast</div>
          <div class="meta-field-value" title="${escapeHtml(movie.cast)}">${escapeHtml(movie.cast ? movie.cast.split(' ').slice(0, 4).join(' ') : 'N/A')}</div>
        </div>
      </div>

      <p class="selected-overview">${escapeHtml(movie.overview)}</p>
    </div>
  `;
}

/**
 * Render a list of movie cards in a target container grid.
 */
function renderMovieGrid(container, movies, isRecommendation = false) {
  if (!container) return;

  if (!movies || movies.length === 0) {
    container.innerHTML = `
      <div class="grid-loading">No recommendations found.</div>
    `;
    return;
  }

  container.innerHTML = movies.map(movie => {
    const genres = (movie.genre || '').split(' ').filter(Boolean).slice(0, 2);
    const simBadge = (isRecommendation && movie.similarity_pct !== undefined)
      ? `<div class="card-similarity-badge">${movie.similarity_pct}% MATCH</div>`
      : '';

    return `
      <div class="movie-card" onclick="selectMovieByTitle('${escapeJsString(movie.title)}')">
        <div class="card-poster">
          ${simBadge}
          <svg class="card-film-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="2" y1="7" x2="7" y2="7"></line>
            <line x1="2" y1="17" x2="7" y2="17"></line>
            <line x1="17" y1="17" x2="22" y2="17"></line>
            <line x1="17" y1="7" x2="22" y2="7"></line>
          </svg>
          <div class="card-poster-title">${escapeHtml(movie.title)}</div>
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <h3 class="card-title">${escapeHtml(movie.title)}</h3>
            <span class="card-year">${escapeHtml(movie.year)}</span>
          </div>

          <div class="card-badges">
            <span class="badge badge-rating">&#9733; ${movie.rating > 0 ? movie.rating : 'N/A'}</span>
            ${genres.map(g => `<span class="badge badge-genre">${escapeHtml(g)}</span>`).join('')}
          </div>

          <p class="card-overview">${escapeHtml(movie.overview)}</p>

          <div class="card-footer">
            <button class="btn-select" type="button">
              ${isRecommendation ? 'Explore Similar' : 'Find Similar'} &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Utility: show status message.
 */
function showStatus(message, type = 'info') {
  const container = document.getElementById('status-container');
  const box = document.getElementById('status-message');
  if (!container || !box) return;

  box.className = `status-box ${type}`;
  box.textContent = message;
  container.classList.remove('hidden');
}

/**
 * Utility: hide status message.
 */
function hideStatus() {
  const container = document.getElementById('status-container');
  if (container) container.classList.add('hidden');
}

/**
 * Escape HTML special characters for safe DOM interpolation.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape single quotes and backslashes for JS string literals.
 */
function escapeJsString(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
