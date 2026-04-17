const DATA_PATH = 'data/japan-gallery.json';

const state = {
  allItems: [],
  filteredItems: [],
  activeTab: 'All',
  lightboxIndex: 0,
  visibleCount: 0,
  lightboxFallback: null,
};

const MOBILE_QUERY = '(max-width: 700px)';
const INITIAL_COUNT_DESKTOP = 12;
const INITIAL_COUNT_MOBILE = 6;
const LOAD_MORE_STEP_DESKTOP = 8;
const LOAD_MORE_STEP_MOBILE = 4;

const featuredStripEl = document.getElementById('featured-strip');
const tabsEl = document.getElementById('gallery-tabs');
const gridEl = document.getElementById('gallery-grid');
const loadMoreBtnEl = document.getElementById('load-more-btn');
const lightboxEl = document.getElementById('lightbox');
const lightboxImageEl = document.getElementById('lightbox-image');
const lightboxCaptionEl = document.getElementById('lightbox-caption');

// Manual customization note:
// Edit captions, places, date/time, dayLabel, tabHints, and featured states in data/japan-gallery.json.
// This script will automatically regenerate tabs and ordering based on those fields.
init().catch((error) => {
  console.error('Unable to load gallery metadata:', error);
  gridEl.innerHTML = '<p>Unable to load gallery metadata right now.</p>';
});

async function init() {
  const response = await fetch(DATA_PATH);
  const metadata = await response.json();

  const ordered = [...metadata.items].sort(compareChronological);
  state.allItems = ordered;

  renderFeatured(ordered.filter((item) => item.featured));
  renderTabs(buildTabs(ordered));
  applyTab('All');
  wireLoadMoreEvents();
  wireLightboxEvents();
}

function compareChronological(a, b) {
  const aKey = `${a.date || ''}T${a.time || ''}`;
  const bKey = `${b.date || ''}T${b.time || ''}`;
  if (aKey && bKey && aKey !== 'T' && bKey !== 'T') {
    return aKey.localeCompare(bKey);
  }
  return (a.sortIndex ?? 0) - (b.sortIndex ?? 0);
}

function buildTabs(items) {
  const tabs = ['All'];
  const dynamic = new Set();

  items.forEach((item) => {
    (item.tabHints || []).forEach((tab) => {
      if (tab && tab.trim()) {
        dynamic.add(tab.trim());
      }
    });
    if (item.place && item.place.trim()) {
      dynamic.add(item.place.trim());
    }
  });

  [...dynamic].sort((a, b) => a.localeCompare(b)).forEach((tab) => tabs.push(tab));
  return tabs;
}

function renderTabs(tabs) {
  tabsEl.innerHTML = '';
  tabs.forEach((tabName) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab-btn';
    button.role = 'tab';
    button.textContent = tabName;
    button.setAttribute('aria-selected', tabName === state.activeTab ? 'true' : 'false');
    button.addEventListener('click', () => applyTab(tabName));
    tabsEl.appendChild(button);
  });
}

function applyTab(tabName) {
  state.activeTab = tabName;
  state.visibleCount = getInitialVisibleCount();
  const match = (item) => {
    if (tabName === 'All') {
      return true;
    }
    const hints = new Set([...(item.tabHints || []), item.place, item.dayLabel, item.groupLabel].filter(Boolean));
    return hints.has(tabName);
  };

  state.filteredItems = state.allItems.filter(match);
  renderGrid();
  [...tabsEl.querySelectorAll('.tab-btn')].forEach((btn) => {
    btn.setAttribute('aria-selected', btn.textContent === tabName ? 'true' : 'false');
  });
}

function renderFeatured(featuredItems) {
  const source = featuredItems.length ? featuredItems : state.allItems.slice(0, 10);
  if (!source.length) {
    featuredStripEl.innerHTML = '<p>No featured photos set yet.</p>';
    return;
  }

  const track = document.createElement('div');
  track.className = 'featured-track';

  // Duplicate the list to create a seamless, slow horizontal roll.
  const doubled = [...source, ...source];
  doubled.forEach((item) => {
    const img = document.createElement('img');
    img.src = item.filePath;
    img.alt = item.caption || item.place || item.dayLabel || 'Japan memory';
    img.className = 'featured-item';
    img.loading = 'lazy';
    track.appendChild(img);
  });

  featuredStripEl.innerHTML = '';
  featuredStripEl.appendChild(track);
}

function renderGrid() {
  gridEl.innerHTML = '';

  if (!state.filteredItems.length) {
    gridEl.innerHTML = '<p>No photos found for this tab yet.</p>';
    updateLoadMoreButton();
    return;
  }

  const visibleItems = state.filteredItems.slice(0, state.visibleCount);

  visibleItems.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'photo-card';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-button';
    button.addEventListener('click', () => {
      const absoluteIndex = state.filteredItems.indexOf(item);
      openLightbox(absoluteIndex, image.currentSrc || image.src, image.alt);
    });

    const image = document.createElement('img');
    image.src = item.filePath;
    image.alt = item.caption || item.place || item.dayLabel || 'Japan trip photo';
    image.loading = 'lazy';

    const meta = document.createElement('div');
    meta.className = 'photo-meta';
    meta.innerHTML = `
      <strong>${escapeHtml(item.caption || item.place || item.dayLabel || 'Japan memory')}</strong>
      <p>${escapeHtml(formatMeta(item))}</p>
    `;

    button.appendChild(image);
    card.append(button, meta);
    gridEl.appendChild(card);
  });

  updateLoadMoreButton();
}

function formatMeta(item) {
  const parts = [];
  if (item.dayLabel) parts.push(item.dayLabel);
  if (item.date) parts.push(item.date);
  if (item.time) parts.push(item.time);
  if (item.place) parts.push(item.place);
  if (!parts.length) parts.push('Details can be added in metadata JSON');
  return parts.join(' • ');
}

function wireLightboxEvents() {
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lightboxImageEl.addEventListener('error', () => {
    if (state.lightboxFallback?.src && lightboxImageEl.src !== state.lightboxFallback.src) {
      lightboxImageEl.src = state.lightboxFallback.src;
      lightboxImageEl.alt = state.lightboxFallback.alt || lightboxImageEl.alt;
      return;
    }

    lightboxImageEl.removeAttribute('src');
    lightboxCaptionEl.textContent = 'Image unavailable for this photo.';
  });
  document.getElementById('lightbox-prev').addEventListener('click', () => stepLightbox(-1));
  document.getElementById('lightbox-next').addEventListener('click', () => stepLightbox(1));
  lightboxEl.addEventListener('click', (event) => {
    if (event.target === lightboxEl) {
      closeLightbox();
    }
  });
  window.addEventListener('keydown', (event) => {
    if (lightboxEl.hasAttribute('hidden')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') stepLightbox(1);
    if (event.key === 'ArrowLeft') stepLightbox(-1);
  });
}

function openLightbox(index, fallbackSrc = '', fallbackAlt = 'Japan trip memory') {
  state.lightboxIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  state.lightboxFallback = { src: fallbackSrc, alt: fallbackAlt };
  renderLightbox();
  lightboxEl.removeAttribute('hidden');
}

function closeLightbox() {
  lightboxEl.setAttribute('hidden', '');
  state.lightboxFallback = null;
}

function stepLightbox(direction) {
  const len = state.filteredItems.length;
  if (!len) return;
  state.lightboxIndex = (state.lightboxIndex + direction + len) % len;
  renderLightbox();
}

function renderLightbox() {
  const item = state.filteredItems[state.lightboxIndex];
  const fallback = state.lightboxFallback || {};

  const source = item?.filePath || fallback.src || '';
  const altText = item?.caption || item?.place || item?.dayLabel || fallback.alt || 'Japan trip memory';

  lightboxImageEl.src = source;
  lightboxImageEl.alt = altText;
  lightboxCaptionEl.textContent = item ? formatMeta(item) : '';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getInitialVisibleCount() {
  return window.matchMedia(MOBILE_QUERY).matches ? INITIAL_COUNT_MOBILE : INITIAL_COUNT_DESKTOP;
}

function getLoadMoreStep() {
  return window.matchMedia(MOBILE_QUERY).matches ? LOAD_MORE_STEP_MOBILE : LOAD_MORE_STEP_DESKTOP;
}

function wireLoadMoreEvents() {
  loadMoreBtnEl.addEventListener('click', () => {
    state.visibleCount = Math.min(state.visibleCount + getLoadMoreStep(), state.filteredItems.length);
    renderGrid();
  });

  window.matchMedia(MOBILE_QUERY).addEventListener('change', () => {
    state.visibleCount = Math.min(state.visibleCount, state.filteredItems.length);
    if (!state.visibleCount) {
      state.visibleCount = getInitialVisibleCount();
    }
    renderGrid();
  });
}

function updateLoadMoreButton() {
  if (!state.filteredItems.length) {
    loadMoreBtnEl.hidden = true;
    return;
  }

  const hiddenCount = Math.max(0, state.filteredItems.length - state.visibleCount);
  loadMoreBtnEl.hidden = hiddenCount === 0;
  if (!loadMoreBtnEl.hidden) {
    loadMoreBtnEl.textContent = `Show ${Math.min(getLoadMoreStep(), hiddenCount)} more photo${hiddenCount === 1 ? '' : 's'}`;
  }
}
