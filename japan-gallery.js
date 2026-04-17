const DATA_PATH = 'data/japan-gallery.json';

const state = {
  allItems: [],
  filteredItems: [],
  activeTab: 'All',
  lightboxIndex: 0,
};

const featuredStripEl = document.getElementById('featured-strip');
const tabsEl = document.getElementById('gallery-tabs');
const gridEl = document.getElementById('gallery-grid');
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
    return;
  }

  state.filteredItems.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'photo-card';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-button';
    button.addEventListener('click', () => openLightbox(index));

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

function openLightbox(index) {
  state.lightboxIndex = index;
  renderLightbox();
  lightboxEl.removeAttribute('hidden');
}

function closeLightbox() {
  lightboxEl.setAttribute('hidden', '');
}

function stepLightbox(direction) {
  const len = state.filteredItems.length;
  if (!len) return;
  state.lightboxIndex = (state.lightboxIndex + direction + len) % len;
  renderLightbox();
}

function renderLightbox() {
  const item = state.filteredItems[state.lightboxIndex];
  if (!item) return;
  lightboxImageEl.src = item.filePath;
  lightboxImageEl.alt = item.caption || item.place || item.dayLabel || 'Japan trip memory';
  lightboxCaptionEl.textContent = formatMeta(item);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
