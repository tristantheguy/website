const DATA_PATH = 'data/japan-gallery.json';

const state = {
  allItems: [],
  filteredItems: [],
  activeTab: 'All',
  lightboxIndex: 0,
  visibleCount: 0,
  lightboxFallback: null,
  lightboxTrigger: null,
  previousOverflow: '',
};

const MOBILE_QUERY = '(max-width: 700px)';
const INITIAL_COUNT_DESKTOP = 12;
const INITIAL_COUNT_MOBILE = 6;
const LOAD_MORE_STEP_DESKTOP = 8;
const LOAD_MORE_STEP_MOBILE = 4;

const featuredStripEl = document.getElementById('featured-strip');
const tabsEl = document.getElementById('gallery-tabs');
const gridEl = document.getElementById('gallery-grid');
const panelEl = document.getElementById('gallery-panel');
const statusEl = document.getElementById('gallery-status');
const loadMoreBtnEl = document.getElementById('load-more-btn');
const lightboxEl = document.getElementById('lightbox');
const lightboxImageEl = document.getElementById('lightbox-image');
const lightboxCaptionEl = document.getElementById('lightbox-caption');

// Manual customization note:
// Edit captions, places, date/time, dayLabel, tabHints, and featured states in data/japan-gallery.json.
// This script will automatically regenerate tabs and ordering based on those fields.
init().catch((error) => {
  console.error('Unable to load gallery metadata:', error);
  statusEl.textContent = 'The photos could not be loaded. Please try refreshing the page.';
});

async function init() {
  const response = await fetch(DATA_PATH);
  if (!response.ok) throw new Error(`Gallery request failed: ${response.status}`);
  const metadata = await response.json();

  const ordered = [...metadata.items].sort(compareByTypeThenChronological);
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


function getMediaKind(item) {
  const filePath = (item?.filePath || '').toLowerCase();
  if (filePath.endsWith('.mp4') || filePath.endsWith('.mov') || filePath.endsWith('.webm')) {
    return 'Videos';
  }
  return 'Photos';
}

function getPhotoType(item) {
  const label = item?.groupLabel?.trim();
  if (label) return label;
  return getMediaKind(item);
}

function compareByTypeThenChronological(a, b) {
  const typeOrder = ['Favorites', 'Other Moments', 'Photos', 'Videos'];
  const aType = getPhotoType(a);
  const bType = getPhotoType(b);

  if (aType !== bType) {
    const aIdx = typeOrder.indexOf(aType);
    const bIdx = typeOrder.indexOf(bType);

    if (aIdx !== -1 || bIdx !== -1) {
      const normalizedA = aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx;
      const normalizedB = bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx;
      if (normalizedA !== normalizedB) return normalizedA - normalizedB;
    }

    const alpha = aType.localeCompare(bType);
    if (alpha !== 0) return alpha;
  }

  return compareChronological(a, b);
}

function buildTabs(items) {
  const tabs = ['All'];
  const dynamic = new Set();

  items.forEach((item) => {
    dynamic.add(getPhotoType(item));

    (item.tabHints || []).forEach((tab) => {
      const normalized = tab?.trim();
      if (!normalized || /^day\s+\d+/i.test(normalized)) return;
      dynamic.add(normalized);
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
  tabs.forEach((tabName, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab-btn';
    button.setAttribute('role', 'tab');
    button.id = `gallery-tab-${index}`;
    button.setAttribute('aria-controls', 'gallery-panel');
    button.tabIndex = tabName === state.activeTab ? 0 : -1;
    button.textContent = tabName;
    button.setAttribute('aria-selected', tabName === state.activeTab ? 'true' : 'false');
    button.addEventListener('click', () => applyTab(tabName));
    tabsEl.appendChild(button);
  });
  tabsEl.addEventListener('keydown', (event) => {
    const buttons = [...tabsEl.querySelectorAll('[role="tab"]')];
    const current = buttons.indexOf(event.target);
    if (current === -1) return;
    let next;
    if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
    if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    applyTab(buttons[next].textContent);
    buttons[next].focus();
  });
}

function applyTab(tabName) {
  state.activeTab = tabName;
  state.visibleCount = getInitialVisibleCount();
  const match = (item) => {
    if (tabName === 'All') {
      return true;
    }
    const hints = new Set([...(item.tabHints || []), item.place, item.groupLabel, getPhotoType(item), getMediaKind(item)].filter(Boolean));
    return hints.has(tabName);
  };

  state.filteredItems = state.allItems.filter(match);
  renderGrid();
  [...tabsEl.querySelectorAll('.tab-btn')].forEach((btn) => {
    const selected = btn.textContent === tabName;
    btn.setAttribute('aria-selected', String(selected));
    btn.tabIndex = selected ? 0 : -1;
    if (selected) panelEl.setAttribute('aria-labelledby', btn.id);
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

  source.forEach((item) => {
    const img = document.createElement('img');
    img.src = item.filePath;
    img.alt = photoDescription(item);
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
    button.setAttribute('aria-label', `Open photo: ${photoDescription(item)}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => {
      const absoluteIndex = state.filteredItems.indexOf(item);
      openLightbox(absoluteIndex, image.currentSrc || image.src, image.alt);
    });

    const image = document.createElement('img');
    image.src = item.filePath;
    image.alt = photoDescription(item);
    image.loading = 'lazy';

    const meta = document.createElement('div');
    meta.className = 'photo-meta';
    meta.innerHTML = `
      <strong>${escapeHtml(item.caption || photoDescription(item))}</strong>
      ${formatMeta(item) ? `<p>${escapeHtml(formatMeta(item))}</p>` : ''}
    `;

    button.appendChild(image);
    card.append(button, meta);
    gridEl.appendChild(card);
  });

  updateLoadMoreButton();
}

function photoDescription(item) {
  return item.alt || item.caption || 'Japan trip photo';
}

function formatMeta(item) {
  const parts = [];
  if (item.dayLabel) parts.push(item.dayLabel);
  if (item.date) parts.push(item.date);
  if (item.time) parts.push(item.time);
  if (item.place) parts.push(item.place);
  return parts.join(' • ');
}

function wireLightboxEvents() {
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lightboxEl.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeLightbox();
  });
  lightboxEl.addEventListener('close', () => {
    document.body.style.overflow = state.previousOverflow;
    state.lightboxFallback = null;
    if (state.lightboxTrigger?.isConnected) state.lightboxTrigger.focus();
    state.lightboxTrigger = null;
  });
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
    if (!lightboxEl.open) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      stepLightbox(event.key === 'ArrowRight' ? 1 : -1);
    }
    if (event.key === 'Tab') {
      const controls = [...lightboxEl.querySelectorAll('button:not([disabled])')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

function openLightbox(index, fallbackSrc = '', fallbackAlt = 'Japan trip memory') {
  state.lightboxTrigger = document.activeElement;
  state.previousOverflow = document.body.style.overflow;
  state.lightboxIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  state.lightboxFallback = { src: fallbackSrc, alt: fallbackAlt };
  renderLightbox();
  // A native modal dialog makes the rest of the document inert, including later-added UI.
  lightboxEl.showModal();
  document.body.style.overflow = 'hidden';
  document.getElementById('lightbox-close').focus();
}

function closeLightbox() {
  lightboxEl.close();
}

function stepLightbox(direction) {
  const len = state.filteredItems.length;
  if (!len) return;
  state.lightboxIndex = (state.lightboxIndex + direction + len) % len;
  state.lightboxFallback = null;
  renderLightbox();
}

function renderLightbox() {
  const item = state.filteredItems[state.lightboxIndex];
  const fallback = state.lightboxFallback || {};

  const source = item?.filePath || fallback.src || '';
  const altText = item ? photoDescription(item) : fallback.alt || 'Japan trip photo';

  lightboxImageEl.src = source;
  lightboxImageEl.alt = altText;
  lightboxCaptionEl.textContent = item
    ? [`Photo ${state.lightboxIndex + 1} of ${state.filteredItems.length}`, item.caption || altText, formatMeta(item)].filter(Boolean).join(' • ')
    : altText;
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
    const previousCount = Math.min(state.visibleCount, state.filteredItems.length);
    state.visibleCount = Math.min(state.visibleCount + getLoadMoreStep(), state.filteredItems.length);
    renderGrid();
    gridEl.querySelectorAll('.photo-button')[previousCount]?.focus();
  });
}

function updateLoadMoreButton() {
  statusEl.textContent = `${state.activeTab}: showing ${Math.min(state.visibleCount, state.filteredItems.length)} of ${state.filteredItems.length} photos.`;
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
