import './style.css'
import { apiFetch, apiPost, getUserLocation, DEFAULT_LOCATION } from './config.js'
import { getCached, setCached, seedMarketListings, getMarketListings, migrateMarketListings, addMarketListing, getScanHistory, addScanHistory } from './storage.js'
import { startCamera, stopCamera, captureFrame, fileToBase64 } from './camera.js'
import { renderSellerMap, destroySellerMap, renderAllSellersMap } from './map.js'

// ── Mock Data (unchanged — not backed by a live endpoint yet) ─────────────────
const NEWS = [
  {
    badge: '🔴 Market Alert',
    badgeClass: '',
    title: 'SUPPLY DEFICIT',
    desc: 'Mangga & Kalabasa prices trending up 14% in regional hubs.',
    icon: '📈',
    iconBg: 'green-bg',
  },
  {
    badge: '🟢 Opportunity',
    badgeClass: 'green',
    title: 'HIGH DEMAND',
    desc: 'Rice straw biochar buyers seeking 5 tonnes in Davao del Norte this week.',
    icon: '🌾',
    iconBg: '',
  },
  {
    badge: '🟡 Advisory',
    badgeClass: 'orange',
    title: 'WEATHER RISK',
    desc: 'Typhoon Signal #1 may affect harvest windows in Cotabato Basin. Plan early.',
    icon: '⚠️',
    iconBg: 'orange-bg',
  },
  {
    badge: '🔵 Policy',
    badgeClass: 'blue',
    title: 'NEW DA SUBSIDY',
    desc: 'DA-SAAD releases ₱2.5B for organic fertilizer distribution in Region XI.',
    icon: '📋',
    iconBg: 'blue-bg',
  },
]

const SEED_MARKET_ITEMS = [
  {
    title: 'Rice Straw (Dry)',
    price: '₱850/ton',
    seller: 'Farmer: Rodrigo M. · Tagum City',
    qty: '4.5 tons',
    tags: [{ label: 'Biochar-ready', cls: '' }, { label: 'Air-dried', cls: '' }, { label: 'Pickup avail.', cls: 'gray' }],
    loc: 'Tagum City, 2.3km',
    distance: '2.3km',
    lat: 7.4478, lng: 125.8078,
  },
  {
    title: 'Coconut Husk Chips',
    price: '₱1,200/bag',
    seller: 'Cooperative: AgriVerde · Carmen, Davao',
    qty: '60 bags (25kg each)',
    tags: [{ label: 'Compost', cls: '' }, { label: 'Coir fiber', cls: '' }, { label: 'Organic', cls: '' }],
    loc: 'Carmen, Davao, 8.1km',
    distance: '8.1km',
    lat: 7.6667, lng: 125.8833,
  },
  {
    title: 'Banana Stem Pulp',
    price: '₱320/sack',
    seller: 'Farmer: Elvie S. · Panabo City',
    qty: '12 sacks',
    tags: [{ label: 'Feed additive', cls: '' }, { label: 'Fresh', cls: 'orange' }, { label: 'Limited', cls: 'orange' }],
    loc: 'Panabo City, 14.5km',
    distance: '14.5km',
    lat: 7.3086, lng: 125.6844,
  },
  {
    title: 'Chicken Manure (Processed)',
    price: '₱600/bag',
    seller: 'Processor: GreenFarm Hub · Sto. Tomas',
    qty: '30 bags (50kg each)',
    tags: [{ label: 'Fertilizer', cls: '' }, { label: 'Composted', cls: '' }, { label: 'Certified', cls: '' }],
    loc: 'Sto. Tomas, Davao, 18.2km',
    distance: '18.2km',
    lat: 7.5333, lng: 125.6167,
  },
]

// ── Crop emoji / badge lookup (backend returns text only, not styling) ────────
const CROP_EMOJI_MAP = {
  mango: '🥭', squash: '🎃', kalabasa: '🎃', coconut: '🥥', niyog: '🥥',
  banana: '🍌', saging: '🍌', chayote: '🥦', sayote: '🥦', rice: '🌾',
  corn: '🌽', cacao: '🍫', cassava: '🍠',
}
function cropEmoji(name) {
  const key = (name || '').toLowerCase()
  const found = Object.keys(CROP_EMOJI_MAP).find(k => key.includes(k))
  return found ? CROP_EMOJI_MAP[found] : '🌱'
}
function demandBadgeClass(level) {
  const l = (level || '').toLowerCase()
  if (l.includes('high')) return 'badge-high'
  if (l.includes('low')) return 'badge-low'
  return 'badge-med'
}

// ── Router / App State ─────────────────────────────────────────────────────────
let currentView = 'home'
let currentCrop = null          // full crop object rendered on the detail screen
let currentMarketItem = null
let chatMessages = []            // in-memory only — resets every time you leave/re-enter AI Chat
let pendingChatAutoPrompt = null // set by card taps (scan results, crop detail) before navigating to ai-chat
let currentNewsIdx = 0
let newsInterval = null
let scanState = 'idle' // idle | scanning | result

// Fetched data + loading/error state (populated by the fetch functions below)
let recommendedCrops = null
let recommendedCropsLoading = false
let recommendedCropsError = null

let cropDetailLoading = false
let cropDetailError = null
let pendingScanCropName = null   // set by the scan flow before it asks for a fetch

let wasteScanResult = null

// Only one scanner view is ever active at a time, so a single tracked
// stream is enough — released whenever navigateTo() leaves the screen.
let activeCameraStream = null

function stopActiveCamera() {
  if (activeCameraStream) {
    stopCamera(activeCameraStream)
    activeCameraStream = null
  }
}

// Marketplace listings, loaded from localStorage (seeded once with starter
// data on first run). This is the live array everything reads from — never
// read SEED_MARKET_ITEMS directly after init().
let marketListings = []

// Real location, resolved via navigator.geolocation at startup.
// Starts as the fallback so the app is usable immediately; init() below
// replaces it with the real coordinates + location name once resolved.
let userLocation = DEFAULT_LOCATION

// ── Fetch functions — always called BEFORE any render/bind happens ────────────
async function fetchBestCrops() {
  const data = await apiFetch('/trends/best-crops-final', userLocation)
  return data.crops
}

async function fetchCropDetail(cropName) {
  return apiFetch('/trends/crop-detail', {
    crop: cropName,
    location: userLocation.location,
    lat: userLocation.lat,
    lng: userLocation.lng,
  })
}

async function fetchWasteConversion(wasteType) {
  return apiFetch('/trends/waste-to-value-and-potential-products', {
    wasteType,
    location: userLocation.location,
  })
}

async function askAI(question) {
  return apiPost('/trends/ask', { question, location: userLocation.location })
}

// ── App Init ──────────────────────────────────────────────────────────────────
function init() {
  updateStatusTime()
  setInterval(updateStatusTime, 30000)
  bindNavigation()

  seedMarketListings(SEED_MARKET_ITEMS)
  marketListings = migrateMarketListings(SEED_MARKET_ITEMS)

  navigateTo('home')

  // Resolve the real location in the background. Home is already shown
  // with the fallback location, so this just updates it silently once
  // the browser's geolocation (and reverse geocode) resolves.
  getUserLocation().then(loc => {
    userLocation = loc
    if (currentView === 'home') {
      document.getElementById('app').innerHTML = renderHome()
      startNewsSlider()
      bindViewEvents()
    }
  })
}

function updateStatusTime() {
  const el = document.getElementById('status-time')
  if (!el) return
  const now = new Date()
  el.textContent = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── Navigation ────────────────────────────────────────────────────────────────
function bindNavigation() {
  document.getElementById('bottom-nav').addEventListener('click', e => {
    const item = e.target.closest('.nav-item')
    if (!item) return
    navigateTo(item.dataset.view)
  })
}

// navigateTo is now async: for screens backed by the API, it fetches FIRST,
// stores the result in state, THEN renders and binds events. No fetch calls
// live inside render functions or event handlers.
async function navigateTo(view, data = null) {
  currentView = view
  if (data) currentCrop = data

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === view)
  })

  const nav = document.getElementById('bottom-nav')
  nav.style.display = (view === 'detail' || view === 'market-map') ? 'none' : 'flex'

  const app = document.getElementById('app')
  clearNewsInterval()
  if (view !== 'scanner' && view !== 'scanner-crop') {
    stopActiveCamera()
  }
  if (view !== 'market-detail' && view !== 'market-map') {
    destroySellerMap()
  }

  switch (view) {
    case 'home':
      app.innerHTML = renderHome()
      break
    case 'recommendations':
      await loadRecommendations()
      break
    case 'ai-chat':
      chatMessages = []
      app.innerHTML = renderAIChat()
      break
    case 'scanner':
      scanState = 'idle'
      wasteScanResult = null
      app.innerHTML = renderScanner()
      break
    case 'scanner-crop':
      scanState = 'idle'
      app.innerHTML = renderScannerCrop()
      break
    case 'marketplace':
      app.innerHTML = renderMarketplace()
      break
    case 'market-detail':
      app.innerHTML = renderMarketplaceDetail()
      break
    case 'market-create':
      app.innerHTML = renderMarketCreate()
      break
    case 'market-filter':
      app.innerHTML = renderMarketFilter()
      break
    case 'market-map':
      app.innerHTML = renderMarketMap()
      break
    case 'market-chat':
      app.innerHTML = renderMarketChat()
      break
    case 'profile':
      app.innerHTML = renderProfile()
      break
    case 'detail':
      await loadCropDetail()
      break
    default:
      app.innerHTML = renderHome()
  }

  if (view === 'home') startNewsSlider()
  if (view === 'scanner') await bindScannerEvents()
  if (view === 'scanner-crop') await bindScannerCropEvents()
  if (view === 'market-create') bindMarketCreateEvents()
  if (view === 'market-chat') bindMarketChatEvents()
  if (view === 'market-detail') bindMarketDetailEvents()
  if (view === 'market-map') bindMarketMapEvents()
  if (view === 'ai-chat') await bindAIChatEvents()
  bindViewEvents()
}

// ── Load + Render: Recommendations (fetch -> state -> render -> bind) ─────────
async function loadRecommendations(forceRefresh = false) {
  const app = document.getElementById('app')
  const cacheKey = `best-crops:${userLocation.location}`

  // Cache hit and not a forced refresh -> render from storage immediately,
  // no network call at all. This is what makes back/forward navigation
  // between the list and detail screens instant instead of re-fetching.
  if (!forceRefresh) {
    const cached = getCached(cacheKey)
    if (cached) {
      recommendedCrops = cached
      recommendedCropsError = null
      recommendedCropsLoading = false
      app.innerHTML = renderRecommendations()
      return
    }
  }

  recommendedCropsLoading = true
  recommendedCropsError = null
  app.innerHTML = renderRecommendations()
  bindViewEvents() // so the back button works while the fetch is in flight

  try {
    recommendedCrops = await fetchBestCrops()
    setCached(cacheKey, recommendedCrops)
  } catch (err) {
    recommendedCropsError = err.message || 'Failed to load recommendations'
  } finally {
    recommendedCropsLoading = false
  }

  app.innerHTML = renderRecommendations()
}

function renderRecommendations() {
  return `
  <div class="view">
    <div class="view-header" style="justify-content: space-between;">
      <div style="display:flex; align-items:center; gap:12px;">
        <button class="back-btn" data-action="home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h2>Best to Plant</h2>
      </div>
      <button class="back-btn" data-action="refresh-recommendations" title="Refresh recommendations" style="flex-shrink:0;">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
      </button>
    </div>
    <p class="view-subtitle">AI-ranked crops for ${userLocation.location} · Based on temperature &amp; market data</p>
    ${renderRecommendationsBody()}
    <div style="height:32px"></div>
  </div>`
}

function renderRecommendationsBody() {
  if (recommendedCropsLoading) {
    return `
    <div style="padding:60px 20px; text-align:center;">
      <div class="scan-spinner" style="margin:0 auto;"></div>
      <p style="color:#5a7a62; font-size:13px; margin-top:16px;">Analyzing climate &amp; market data...</p>
    </div>`
  }
  if (recommendedCropsError) {
    return `
    <div style="padding:40px 20px; text-align:center;">
      <p style="color:#c0392b; font-size:14px; margin-bottom:14px;">⚠️ ${recommendedCropsError}</p>
      <button class="scanner-btn-primary" data-action="retry-recommendations" style="display:inline-flex; width:auto; padding:12px 24px;">Retry</button>
    </div>`
  }
  if (!recommendedCrops || recommendedCrops.length === 0) {
    return `<div style="padding:40px 20px; text-align:center; color:#5a7a62;">No recommendations available right now.</div>`
  }
  return `
  <div class="crop-list">
    ${recommendedCrops.map((c, i) => `
    <div class="crop-card" style="animation-delay: ${i * 0.08}s" data-action="detail" data-crop-index="${i}">
      <div class="crop-emoji" style="background:#eef7f1">${cropEmoji(c.name)}</div>
      <div class="crop-info">
        <div class="crop-name">${c.name} <span class="crop-local">(${c.localName || ''})</span></div>
        <div class="crop-meta">
          <span class="crop-meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${c.bestPlantMonth || '—'}
          </span>
          <span class="crop-meta-item">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:1px"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            ${(c.expectedRevenuePerHa || '').split('/')[0]}
          </span>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;">
        <span class="crop-badge ${demandBadgeClass(c.demandLevel)}">${c.demandLevel || 'N/A'}</span>
        <svg class="crop-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>`).join('')}
  </div>`
}

// ── Load + Render: Crop Detail (fetch -> state -> render -> bind) ─────────────
async function loadCropDetail() {
  const app = document.getElementById('app')

  // Case 1: navigated here with a full crop object already (tapped from the
  // recommendations list) — no fetch needed, we already have everything.
  if (currentCrop && currentCrop.name && !currentCrop.needsFetch) {
    cropDetailError = null
    cropDetailLoading = false
    app.innerHTML = renderDetail()
    return
  }

  // Case 2: navigated here from the scan flow, which only knows the crop
  // NAME so far — fetch the full detail before rendering anything real.
  cropDetailLoading = true
  cropDetailError = null
  app.innerHTML = renderDetail()
  bindViewEvents()

  try {
    const cropName = pendingScanCropName || 'Mango'
    currentCrop = await fetchCropDetail(cropName)
    addScanHistory('crop', currentCrop)
  } catch (err) {
    cropDetailError = err.message || 'Failed to load crop detail'
  } finally {
    cropDetailLoading = false
    pendingScanCropName = null
  }

  app.innerHTML = renderDetail()
}

function renderDetail() {
  if (cropDetailLoading) {
    return `
    <div class="view">
      <div class="view-header">
        <button class="back-btn" data-action="home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h2>Crop Details</h2>
      </div>
      <div style="padding:70px 20px; text-align:center;">
        <div class="scan-spinner" style="margin:0 auto;"></div>
        <p style="color:#5a7a62; font-size:13px; margin-top:16px;">Loading crop analysis...</p>
      </div>
    </div>`
  }

  if (cropDetailError || !currentCrop) {
    return `
    <div class="view">
      <div class="view-header">
        <button class="back-btn" data-action="home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h2>Crop Details</h2>
      </div>
      <div style="padding:40px 20px; text-align:center;">
        <p style="color:#c0392b; font-size:14px;">⚠️ ${cropDetailError || 'No crop data available'}</p>
      </div>
    </div>`
  }

  const c = currentCrop
  return `
  <div class="view">
    <div class="view-header">
      <button class="back-btn" data-action="recommendations">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>Crop Details</h2>
    </div>
    <div style="margin:0 20px">
      <div class="detail-hero">${cropEmoji(c.name)}</div>
    </div>
    <div class="detail-body">
      <div class="detail-name">${c.name} <span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.45)">(${c.localName || ''})</span></div>
      <div class="detail-local">${c.climateNote || ''}</div>
      <div class="detail-cards">
        <div class="detail-card">
          <div class="detail-card-title">📊 Climate Match</div>
          <div class="detail-row">
            <span class="detail-row-label">Temperature Fit</span>
            <span class="detail-row-value">${c.temperatureFit ?? '—'}%</span>
          </div>
          <div class="detail-bar"><div class="detail-bar-fill" style="width:${c.temperatureFit ?? 0}%"></div></div>
          <div class="detail-row mt-8">
            <span class="detail-row-label">Best Plant Month</span>
            <span class="detail-row-value">${c.bestPlantMonth || '—'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row-label">Harvest Window</span>
            <span class="detail-row-value">${c.harvestWindowDays || '—'}</span>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-card-title">💹 Market Analysis</div>
          <div class="detail-row">
            <span class="detail-row-label">Estimated Profit</span>
            <span class="detail-row-value" style="color:#1d6b35;font-size:15px;font-weight:800">${c.expectedRevenuePerHa || '—'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row-label">Demand Level</span>
            <span class="detail-row-value">${c.demandLevel || '—'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row-label">Market Risk</span>
            <span class="detail-row-value">${c.marketRisk || '—'}</span>
          </div>
          <div style="font-size:12px;color:#6b8f72;margin-top:8px;line-height:1.5;">${c.marketNote || ''}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card-title">⚙️ Effort &amp; Inputs</div>
          <div class="detail-row">
            <span class="detail-row-label">Effort Level</span>
            <span class="detail-row-value">${c.effortLevel || '—'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row-label">Location</span>
            <span class="detail-row-value">${c.location || userLocation.location}</span>
          </div>
        </div>
      </div>
      <button class="detail-action-btn" data-action="marketplace">
        🛒 Find Buyers &amp; Create Listing
      </button>
      <button class="detail-action-btn" data-action="ai-chat" data-prompt="Give me practical tips for growing ${c.name} in ${c.location || userLocation.location}. What should I watch out for?" style="background:#fff; color:#1d6b35; border:1.5px solid #1d6b35; margin-top:10px;">
        💬 Ask AgriAI About ${c.name}
      </button>
      <div style="height:24px"></div>
    </div>
  </div>`
}

// ── News Slider ───────────────────────────────────────────────────────────────
function startNewsSlider() {
  currentNewsIdx = 0
  updateNewsSlider()
  newsInterval = setInterval(() => {
    currentNewsIdx = (currentNewsIdx + 1) % NEWS.length
    updateNewsSlider()
  }, 3500)
}

function clearNewsInterval() {
  if (newsInterval) { clearInterval(newsInterval); newsInterval = null }
}

function updateNewsSlider() {
  const slider = document.getElementById('news-slider')
  const dots = document.querySelectorAll('.news-dot')
  if (!slider) return
  slider.style.transform = `translateX(calc(-${currentNewsIdx * 100}% - ${currentNewsIdx * 12}px))`
  dots.forEach((d, i) => d.classList.toggle('active', i === currentNewsIdx))
}

// ── Render: Home ──────────────────────────────────────────────────────────────
function renderHome() {
  return `
  <div class="view">
    <div class="home-header">
      <div class="home-title-wrapper">
        <img src="/logo.png" alt="AgriSphere" class="home-logo" />
        <h1>AgriSphere</h1>
      </div>
      <div class="home-location">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${userLocation.location}, PH
      </div>
    </div>

    <div class="news-ticker-wrapper">
      <div class="news-cards-slider" id="news-slider">
        ${NEWS.map(n => `
        <div class="news-card">
          <div class="news-badge ${n.badgeClass}">
            <div class="news-badge-dot"></div>
            ${n.badge}
          </div>
          <div class="news-title">${n.title}</div>
          <div class="news-desc">${n.desc}</div>
          <div class="news-chart-icon ${n.iconBg}">
            <span style="font-size:24px">${n.icon}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>
    <div class="news-dots">
      ${NEWS.map((_, i) => `<div class="news-dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></div>`).join('')}
    </div>

    <div class="action-grid">
      <div class="action-card" data-action="recommendations">
        <div class="action-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="19" cy="5" r="3" fill="white" stroke="none"/>
          </svg>
        </div>
        <h3>Best to Plant</h3>
        <p>Data-driven recommendations</p>
      </div>
      <div class="action-card" data-action="scanner-crop">
        <div class="action-icon secondary">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </div>
        <h3>Worth the risk?</h3>
        <p>Scan &amp; analyze market risk</p>
      </div>
    </div>

    <div class="stats-strip">
      <div class="stat-chip">
        <div class="stat-value">12.4t</div>
        <div class="stat-label">Waste Diverted</div>
      </div>
      <div class="stat-chip">
        <div class="stat-value">₱48K</div>
        <div class="stat-label">Income Generated</div>
      </div>
      <div class="stat-chip">
        <div class="stat-value">3</div>
        <div class="stat-label">Active Listings</div>
      </div>
    </div>

    <div class="impact-card">
      <div class="impact-card-header">
        <div class="impact-card-label">
          🌍 Your Circular Impact
        </div>
        <span class="impact-card-badge">This Month</span>
      </div>
      <div class="impact-main">
        <div class="impact-main-value">12.4t</div>
        <div class="impact-main-unit">waste diverted</div>
      </div>
      <div class="impact-equals">
        <span>=</span>
        <strong>8.7t CO₂e avoided</strong>
        <span>· equiv. to 38 trees planted</span>
      </div>
      <div class="impact-bar-row">
        <div class="impact-bar-item">
          <span class="impact-bar-item-label">CO₂ Avoided</span>
          <div class="impact-bar-track"><div class="impact-bar-fill" style="width:74%"></div></div>
          <span class="impact-bar-val">74%</span>
        </div>
        <div class="impact-bar-item">
          <span class="impact-bar-item-label">Income Goal</span>
          <div class="impact-bar-track"><div class="impact-bar-fill yellow" style="width:61%"></div></div>
          <span class="impact-bar-val">61%</span>
        </div>
        <div class="impact-bar-item">
          <span class="impact-bar-item-label">Listings Filled</span>
          <div class="impact-bar-track"><div class="impact-bar-fill" style="width:55%"></div></div>
          <span class="impact-bar-val">55%</span>
        </div>
      </div>
    </div>

    <div class="opportunity-card" id="opp-card" data-action="recommendations">
      <div class="opp-top">
        <div class="opp-badge">
          <div class="opp-badge-dot"></div>
          Today's Opportunity
        </div>
        <button class="opp-dismiss" id="opp-dismiss" title="Dismiss">×</button>
      </div>
      <div class="opp-title">Plant Mango Before August 🥭</div>
      <div class="opp-subtitle">Supply deficit alert active. Mangga prices up 14% — your climate conditions are an 88% match. Now is the best window to act.</div>
      <div class="opp-data-row">
        <div class="opp-data-chip accent">
          <div class="opp-data-chip-val">₱12,400</div>
          <div class="opp-data-chip-lbl">Est. Profit /ha</div>
        </div>
        <div class="opp-data-chip">
          <div class="opp-data-chip-val">88%</div>
          <div class="opp-data-chip-lbl">Climate Match</div>
        </div>
        <div class="opp-data-chip">
          <div class="opp-data-chip-val">Low</div>
          <div class="opp-data-chip-lbl">Market Risk</div>
        </div>
      </div>
      <button class="opp-cta" data-action="recommendations">
        View Full Recommendation
        <svg class="opp-cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>

    <div style="height:18px"></div>
  </div>`
}

// ── Render: AI Chat ───────────────────────────────────────────────────────────
function chatBubble(role, html) {
  if (role === 'user') {
    return `
      <div style="display:flex; gap:12px; align-items:flex-end; flex-direction:row-reverse;">
        <div style="background:#1d6b35; padding:12px 16px; border-radius:16px 16px 4px 16px; box-shadow:0 2px 8px rgba(29,107,53,0.1); max-width:85%; font-size:14px; color:#fff; line-height:1.5;">
          ${html}
        </div>
      </div>`
  }
  return `
      <div style="display:flex; gap:12px;">
        <div style="width:32px; height:32px; border-radius:50%; background:#1d6b35; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path></svg>
        </div>
        <div style="background:#fff; padding:12px 16px; border-radius:4px 16px 16px 16px; box-shadow:0 2px 8px rgba(0,0,0,0.03); max-width:88%; font-size:13.5px; color:#1a3320; line-height:1.6;">
          ${html}
        </div>
      </div>`
}

function renderAIChat() {
  const bubbles = [
    chatBubble('assistant', `Hello! I'm AgriAI. How can I help you today?`),
    ...chatMessages.map(m => chatBubble(m.role, m.role === 'user' ? escapeHtml(m.text) : m.text)),
  ].join('<div style="height:4px"></div>')

  return `
  <div class="view" style="background:#f4f7f5; display:flex; flex-direction:column; min-height:100%;">
    <div class="view-header" style="background:#1d6b35; padding:16px 20px 20px; flex-shrink:0;">
      <h2 style="font-size:24px; font-weight:800;">AgriAI Assistant</h2>
      <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:4px;">Ask me anything about farming & waste</div>
    </div>
    <div id="chat-body" style="flex:1; padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:16px;">
      ${bubbles}
    </div>
    <div style="background:#fff; border-top:1px solid #e0ede4; padding:16px 20px 30px; display:flex; align-items:center; gap:12px; flex-shrink:0;">
      <input type="text" id="chat-input" placeholder="Ask AgriAI..." style="flex:1; background:#f4f7f5; border:1px solid #d1dfd5; padding:14px 16px; border-radius:24px; font-size:15px; color:#0a1a0f; outline:none;" />
      <button id="chat-send" style="width:44px; height:44px; border-radius:50%; background:#1d6b35; border:none; display:flex; align-items:center; justify-content:center; color:#fff; cursor:pointer; flex-shrink:0; box-shadow:0 4px 12px rgba(29,107,53,0.3);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:translateX(-1px);"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
  </div>`
}

async function bindAIChatEvents() {
  const input = document.getElementById('chat-input')
  const sendBtn = document.getElementById('chat-send')
  const body = document.getElementById('chat-body')

  const scrollToBottom = () => { if (body) body.scrollTop = body.scrollHeight }
  scrollToBottom()

  const send = async (question) => {
    const text = (question ?? input.value).trim()
    if (!text) return

    input.value = ''
    input.disabled = true
    sendBtn.disabled = true

    chatMessages.push({ role: 'user', text })
    body.insertAdjacentHTML('beforeend', '<div style="height:4px"></div>' + chatBubble('user', escapeHtml(text)))
    body.insertAdjacentHTML('beforeend', `<div id="chat-loading" style="height:4px"></div>${chatBubble('assistant', '<em style="color:#8aa691;">AgriAI is thinking...</em>')}`)
    scrollToBottom()

    try {
      const result = await askAI(text)
      chatMessages.push({ role: 'assistant', text: escapeHtml(result.answer).replace(/\n/g, '<br>') })
    } catch (err) {
      chatMessages.push({ role: 'assistant', text: `⚠️ ${escapeHtml(err.message || 'Something went wrong, please try again.')}` })
    }

    // Re-render the whole thread so the "thinking..." bubble is replaced cleanly
    document.getElementById('app').innerHTML = renderAIChat()
    await bindAIChatEvents()
  }

  sendBtn.addEventListener('click', () => send())
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send() })
  input.disabled = false
  sendBtn.disabled = false

  if (pendingChatAutoPrompt) {
    const autoPrompt = pendingChatAutoPrompt
    pendingChatAutoPrompt = null
    await send(autoPrompt)
  }
}

// ── Render + Load: Scanner (Waste to Value) ────────────────────────────────────
function renderScanner() {
  return `
  <div class="view scanner-view">
    <div class="scanner-header">
      <h2>AI Crop Scanner</h2>
      <p>Identify waste or assess crop risk using your camera</p>
    </div>
    <div class="scanner-frame" id="scanner-frame">
      <video id="scanner-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:none;"></video>
      <canvas id="scanner-canvas" style="display:none;"></canvas>
      <div class="scanner-corners"><span></span></div>
      <div class="scanner-line" id="scanner-line"></div>
      <svg class="scan-placeholder-icon" id="scanner-placeholder-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span class="scan-placeholder-text" id="scanner-placeholder-text">Starting camera...</span>
    </div>
    <p class="scanner-label" id="scanner-status-label">Supports rice straw, corn stalks, banana waste &amp; more</p>
    <div class="scanner-actions">
      <button class="scanner-btn-primary" id="btn-scan">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        Capture &amp; Scan
      </button>
      <button class="scanner-btn-secondary" id="btn-upload">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Upload
      </button>
      <input type="file" id="file-upload" accept="image/*" style="display:none;">
    </div>
    <div id="scan-result-area"></div>
    <div id="scan-history-waste"></div>
    <div style="height:16px"></div>
  </div>`
}

async function bindScannerEvents() {
  const video = document.getElementById('scanner-video')
  const { stream, mode } = await startCamera(video)
  activeCameraStream = stream
  applyCameraUiState(mode, 'scanner-video', 'scanner-placeholder-icon', 'scanner-placeholder-text', 'scanner-line', 'btn-scan', 'scanner-status-label', 'Supports rice straw, corn stalks, banana waste & more')

  document.getElementById('btn-scan')?.addEventListener('click', () => startScan(mode))
  document.getElementById('btn-upload')?.addEventListener('click', () => document.getElementById('file-upload').click())
  document.getElementById('file-upload')?.addEventListener('change', handleWasteUpload)
  renderScanHistorySection('waste')
}

// Shows/hides the live video vs. the placeholder icon based on whether a
// camera actually started, and disables the capture button + shows an
// "upload instead" message if no camera is available at all.
function applyCameraUiState(mode, videoId, iconId, textId, lineId, captureBtnId, labelId, defaultLabel) {
  const video = document.getElementById(videoId)
  const icon = document.getElementById(iconId)
  const text = document.getElementById(textId)
  const line = document.getElementById(lineId)
  const captureBtn = document.getElementById(captureBtnId)
  const label = document.getElementById(labelId)

  if (mode === 'rear' || mode === 'webcam') {
    if (video) video.style.display = 'block'
    if (icon) icon.style.display = 'none'
    if (text) text.style.display = 'none'
    if (line) line.style.display = 'block'
    if (label) label.textContent = mode === 'webcam'
      ? 'Using webcam (no rear camera detected)'
      : defaultLabel
  } else {
    if (video) video.style.display = 'none'
    if (icon) icon.style.display = 'block'
    if (text) {
      text.style.display = 'block'
      text.textContent = 'Camera unavailable'
    }
    if (line) line.style.display = 'none'
    if (captureBtn) {
      captureBtn.disabled = true
      captureBtn.style.opacity = '0.5'
      captureBtn.style.cursor = 'not-allowed'
    }
    if (label) label.textContent = 'No camera detected — please upload an image instead.'
  }
}

// startScan: capture the current frame -> identify via backend -> if a
// waste material is identified, fetch its waste-to-value data; otherwise
// show a clear "couldn't identify" message.
async function startScan(mode) {
  if (scanState === 'scanning') return
  if (mode !== 'rear' && mode !== 'webcam') return // capture button is disabled in this case anyway

  const video = document.getElementById('scanner-video')
  const canvas = document.getElementById('scanner-canvas')
  const frame = document.getElementById('scanner-frame')
  if (!video || !canvas || !frame) return

  scanState = 'scanning'
  const { base64, mimeType } = captureFrame(video, canvas)

  const overlay = document.createElement('div')
  overlay.className = 'scan-processing'
  overlay.innerHTML = `
    <div class="scan-spinner"></div>
    <div class="scan-processing-text">Analyzing biomass...</div>
    <div class="scan-processing-sub">Matching with crop database</div>
  `
  frame.appendChild(overlay)

  await runIdentifyAndRender(base64, mimeType, overlay, 'waste')
}

async function handleWasteUpload(e) {
  const file = e.target.files[0]
  if (!file || scanState === 'scanning') return
  scanState = 'scanning'

  const frame = document.getElementById('scanner-frame')
  const { base64, mimeType } = await fileToBase64(file)

  const overlay = document.createElement('div')
  overlay.className = 'scan-processing'
  overlay.innerHTML = `
    <div class="scan-spinner"></div>
    <div class="scan-processing-text">Analyzing uploaded image...</div>
    <div class="scan-processing-sub">Matching with crop database</div>
  `
  frame.appendChild(overlay)

  await runIdentifyAndRender(base64, mimeType, overlay, 'waste')
}

// Shared by both capture and upload paths for the waste scanner.
async function runIdentifyAndRender(base64, mimeType, overlay, expectedCategory) {
  const area = document.getElementById('scan-result-area')
  try {
    const result = await apiPost('/trends/identify-image', { image: base64, mimeType })

    if (!result.identified) {
      area.innerHTML = `<div style="padding:20px; text-align:center; color:#c0392b; font-size:14px;">⚠️ ${result.message || 'Could not identify a crop or waste material in this image. Please try again with a clearer photo.'}</div>`
      scanState = 'idle'
      return
    }

    wasteScanResult = await fetchWasteConversion(result.name)
    addScanHistory('waste', wasteScanResult)
    renderScanResult()
    renderScanHistorySection('waste')
  } catch (err) {
    area.innerHTML = `<div style="padding:20px; text-align:center; color:#c0392b; font-size:14px;">⚠️ ${err.message || 'Scan failed. Please try again.'}</div>`
  } finally {
    overlay.remove()
    scanState = 'result'
  }
}

function renderScanResult() {
  const r = wasteScanResult
  const area = document.getElementById('scan-result-area')
  if (!r || !area) return

  area.innerHTML = `
  <div class="scan-result">
    <div class="scan-result-header">
      <span class="scan-result-icon">🌾</span>
      <div>
        <div class="scan-result-name">${r.wasteType} Identified</div>
        <span class="scan-result-quality">${r.qualityLabel} · ${r.confidence}% Confidence</span>
      </div>
    </div>
    <div class="scan-tabs">
      <div class="scan-tab active" id="tab-wtv" data-tab="wtv">
        <span class="scan-tab-icon">♻️</span>
        <span class="scan-tab-label">Waste to Value</span>
      </div>
      <div class="scan-tab" id="tab-pp" data-tab="pp">
        <span class="scan-tab-icon">📦</span>
        <span class="scan-tab-label">Potential Products</span>
      </div>
    </div>
    <div class="scan-panel" id="panel-wtv">
      ${r.wasteToValue.map(item => `
      <div class="scan-panel-row" data-action="ai-chat" data-prompt="How do I turn ${r.wasteType} into ${item.name}? Give me a simple step-by-step process, plus tips for selling it in ${userLocation.location}.">
        <span class="scan-panel-emoji">${item.best ? '⭐' : '♻️'}</span>
        <div class="scan-panel-info">
          <div class="scan-panel-title">${item.name} ${item.best ? '<span class="scan-best-tag">BEST</span>' : ''}</div>
          <div class="scan-panel-desc">${item.note}</div>
        </div>
        <div class="scan-panel-val">${item.estimatedPrice}</div>
      </div>`).join('')}
    </div>
    <div class="scan-panel hidden" id="panel-pp">
      ${r.potentialProducts.map(item => `
      <div class="scan-panel-row" data-action="ai-chat" data-prompt="What's the best way to convert ${r.wasteType} into ${item.name} as a finished product? Explain the process and where I could sell it in ${userLocation.location}.">
        <span class="scan-panel-emoji">📦</span>
        <div class="scan-panel-info">
          <div class="scan-panel-title">${item.name}</div>
          <div class="scan-panel-desc">${item.note}</div>
        </div>
        <div class="scan-panel-val">${item.estimatedPrice}</div>
      </div>`).join('')}
    </div>
  </div>`

  document.querySelectorAll('.scan-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'))
      document.querySelectorAll('.scan-panel').forEach(p => p.classList.add('hidden'))
      tab.classList.add('active')
      document.getElementById('panel-' + tab.dataset.tab).classList.remove('hidden')
    })
  })

  bindViewEvents()
}

// ── Render + Load: Scanner Crop (Risk Analyzer -> Crop Detail) ─────────────────
function renderScannerCrop() {
  return `
  <div class="view scanner-view">
    <div class="scanner-header">
      <h2>Crop Risk Analyzer</h2>
      <p>Scan crops to evaluate climate fit and market risk</p>
    </div>
    <div class="scanner-frame" id="scanner-frame-crop">
      <video id="scanner-video-crop" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:none;"></video>
      <canvas id="scanner-canvas-crop" style="display:none;"></canvas>
      <div class="scanner-corners"><span></span></div>
      <div class="scanner-line" id="scanner-line-crop"></div>
      <svg class="scan-placeholder-icon" id="scanner-placeholder-icon-crop" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span class="scan-placeholder-text" id="scanner-placeholder-text-crop">Starting camera...</span>
    </div>
    <p class="scanner-label" id="scanner-status-label-crop">Ensure the leaves and fruit (if any) are clearly visible.</p>
    <div class="scanner-actions">
      <button class="scanner-btn-primary" id="btn-scan-crop">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        Capture &amp; Scan
      </button>
      <button class="scanner-btn-secondary" id="btn-upload-crop">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Upload
      </button>
      <input type="file" id="file-upload-crop" accept="image/*" style="display:none;">
    </div>
    <div id="scan-result-area-crop"></div>
    <div id="scan-history-crop"></div>
    <div style="height:16px"></div>
  </div>`
}

async function bindScannerCropEvents() {
  const video = document.getElementById('scanner-video-crop')
  const { stream, mode } = await startCamera(video)
  activeCameraStream = stream
  applyCameraUiState(mode, 'scanner-video-crop', 'scanner-placeholder-icon-crop', 'scanner-placeholder-text-crop', 'scanner-line-crop', 'btn-scan-crop', 'scanner-status-label-crop', 'Ensure the leaves and fruit (if any) are clearly visible.')

  document.getElementById('btn-scan-crop')?.addEventListener('click', () => startScanCrop(mode))
  document.getElementById('btn-upload-crop')?.addEventListener('click', () => document.getElementById('file-upload-crop').click())
  document.getElementById('file-upload-crop')?.addEventListener('change', handleCropUpload)
  renderScanHistorySection('crop')
}

async function startScanCrop(mode) {
  if (scanState === 'scanning') return
  if (mode !== 'rear' && mode !== 'webcam') return

  const video = document.getElementById('scanner-video-crop')
  const canvas = document.getElementById('scanner-canvas-crop')
  const frame = document.getElementById('scanner-frame-crop')
  if (!video || !canvas || !frame) return

  scanState = 'scanning'
  const { base64, mimeType } = captureFrame(video, canvas)

  const overlay = document.createElement('div')
  overlay.className = 'scan-processing'
  overlay.innerHTML = `
    <div class="scan-spinner"></div>
    <div class="scan-processing-text">Analyzing plant features...</div>
    <div class="scan-processing-sub">Matching with crop database</div>
  `
  frame.appendChild(overlay)

  await runCropIdentifyAndRender(base64, mimeType, overlay)
}

async function handleCropUpload(e) {
  const file = e.target.files[0]
  if (!file || scanState === 'scanning') return
  scanState = 'scanning'

  const frame = document.getElementById('scanner-frame-crop')
  const { base64, mimeType } = await fileToBase64(file)

  const overlay = document.createElement('div')
  overlay.className = 'scan-processing'
  overlay.innerHTML = `
    <div class="scan-spinner"></div>
    <div class="scan-processing-text">Analyzing uploaded image...</div>
    <div class="scan-processing-sub">Matching with crop database</div>
  `
  frame.appendChild(overlay)

  await runCropIdentifyAndRender(base64, mimeType, overlay)
}

async function runCropIdentifyAndRender(base64, mimeType, overlay) {
  const resultArea = document.getElementById('scan-result-area-crop')
  try {
    const result = await apiPost('/trends/identify-image', { image: base64, mimeType })

    if (!result.identified) {
      resultArea.innerHTML = `<div style="padding:20px; text-align:center; color:#c0392b; font-size:14px;">⚠️ ${result.message || 'Could not identify a crop in this image. Please try again with a clearer photo.'}</div>`
      overlay.remove()
      scanState = 'idle'
      return
    }

    resultArea.innerHTML = `
    <div class="scan-result">
      <div class="scan-result-header">
        <span class="scan-result-icon">${cropEmoji(result.name)}</span>
        <div>
          <div class="scan-result-name">${result.name} Identified</div>
          <span class="scan-result-quality">${result.confidence}% Confidence</span>
        </div>
      </div>
      <p style="font-size:12px; color:#5a7a62; margin-top:8px;">Loading full climate &amp; market analysis...</p>
    </div>`

    overlay.remove()
    scanState = 'result'
    stopActiveCamera()

    setTimeout(() => {
      pendingScanCropName = result.name
      currentCrop = { needsFetch: true }
      navigateTo('detail')
    }, 600)
  } catch (err) {
    resultArea.innerHTML = `<div style="padding:20px; text-align:center; color:#c0392b; font-size:14px;">⚠️ ${err.message || 'Scan failed. Please try again.'}</div>`
    overlay.remove()
    scanState = 'result'
  }
}

// ── Scan History (shared by both scanner screens) ──────────────────────────
// Tapping a history card reopens the result through the SAME render path a
// live scan uses — renderScanResult() for waste, navigateTo('detail', ...)
// for crop — just fed from localStorage instead of a fresh AI call.
function renderScanHistorySection(type) {
  const containerId = type === 'waste' ? 'scan-history-waste' : 'scan-history-crop'
  const container = document.getElementById(containerId)
  if (!container) return

  const history = getScanHistory(type)
  if (history.length === 0) {
    container.innerHTML = ''
    return
  }

  container.innerHTML = `
    <p style="color:#fff; font-size:13px; font-weight:600; margin:18px 0 8px;">Recent scans</p>
    <div style="display:flex; flex-direction:column; gap:8px;">
      ${history.map((entry, i) => renderHistoryCard(type, entry, i)).join('')}
    </div>
  `

  container.querySelectorAll('[data-history-index]').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.historyIndex, 10)
      const entry = history[idx]
      if (type === 'waste') {
        wasteScanResult = entry
        renderScanResult()
      } else {
        currentCrop = entry
        navigateTo('detail', entry)
      }
    })
  })
}

function renderHistoryCard(type, entry, index) {
  if (type === 'waste') {
    const top = (entry.wasteToValue || []).find(i => i.best) || (entry.wasteToValue || [])[0]
    return `
      <div data-history-index="${index}" style="background:rgba(255,255,255,0.06); border-radius:12px; padding:10px 12px; display:flex; align-items:center; gap:10px; cursor:pointer;">
        <span style="font-size:18px;">🌾</span>
        <div style="flex:1; min-width:0;">
          <div style="color:#fff; font-size:13px; font-weight:600;">${entry.wasteType}</div>
          <div style="color:#9db3a5; font-size:11px;">${top ? 'Best: ' + top.name : 'No suggestions saved'}</div>
        </div>
        <div style="color:#8fd4a8; font-size:12px; font-weight:600; flex-shrink:0;">${top ? top.estimatedPrice : ''}</div>
      </div>`
  }
  return `
    <div data-history-index="${index}" style="background:rgba(255,255,255,0.06); border-radius:12px; padding:10px 12px; display:flex; align-items:center; gap:10px; cursor:pointer;">
      <span style="font-size:18px;">${cropEmoji(entry.name)}</span>
      <div style="flex:1; min-width:0;">
        <div style="color:#fff; font-size:13px; font-weight:600;">${entry.name}</div>
        <div style="color:#9db3a5; font-size:11px;">${entry.demandLevel || entry.bestPlantMonth || ''}</div>
      </div>
      <div style="color:#8fd4a8; font-size:12px; font-weight:600; flex-shrink:0;">${entry.expectedRevenuePerHa || ''}</div>
    </div>`
}

// ── Render: Marketplace ───────────────────────────────────────────────────────
function renderMarketplace() {
  const filters = ['All', 'Crop Waste', 'Manure', 'Biochar', 'Compost', 'Feed']
  return `
  <div class="view">
    <div class="view-header" style="justify-content: space-between;">
      <div style="display:flex; align-items:center; gap:12px;">
        <button class="back-btn" data-action="home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h2>Marketplace</h2>
      </div>
      <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
        <button class="back-btn" data-action="market-map" title="View all sellers on map">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
        </button>
        <button class="back-btn" data-action="market-filter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
        </button>
      </div>
    </div>
    <div class="market-filter">
      ${filters.map((f, i) => `<button class="filter-chip ${i === 0 ? 'active' : ''}" data-filter="${f}">${f}</button>`).join('')}
    </div>
    <div class="market-list">
      ${marketListings.map(m => `
      <div class="market-card" data-action="marketplace-detail">
        <div class="market-card-header">
          <div class="market-card-title">${m.title}</div>
          <div class="market-card-price">${m.price}</div>
        </div>
        <div class="market-card-seller">${m.seller}</div>
        <div class="market-card-tags">
          ${m.tags.map(t => `<span class="market-tag ${t.cls}">${t.label}</span>`).join('')}
        </div>
        <div class="market-card-footer">
          <div class="market-card-loc">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${m.loc}
          </div>
          <button class="market-contact-btn" data-qty="${m.qty}">Contact Seller</button>
        </div>
      </div>`).join('')}
    </div>
    <button class="fab-btn" data-action="market-create">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
    </button>
    <div style="height:16px"></div>
  </div>`
}

// ── Render: Marketplace Full Map (all sellers) ──────────────────────────────────
function renderMarketMap() {
  const pinnedCount = marketListings.filter(m => m.lat != null && m.lng != null).length
  return `
  <div class="view" style="display:flex; flex-direction:column; min-height:100%;">
    <div class="view-header" style="flex-shrink:0;">
      <button class="back-btn" data-action="marketplace">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>All Sellers</h2>
    </div>
    <p class="view-subtitle" style="margin-top:-4px;">${pinnedCount} listing${pinnedCount === 1 ? '' : 's'} pinned · Tap a marker to view details</p>
    ${pinnedCount === 0
      ? `<div style="padding:60px 20px; text-align:center; color:#8aa691; font-size:14px;">No seller locations available yet.</div>`
      : `<div id="all-sellers-map" style="flex:1; min-height:400px;"></div>`
    }
  </div>`
}

function bindMarketMapEvents() {
  renderAllSellersMap('all-sellers-map', marketListings)
}


function renderMarketplaceDetail() {
  const m = currentMarketItem || marketListings[0]
  return `
  <div class="view" style="background:#f4f7f5; min-height:100%;">
    <div class="view-header" style="background:#1d6b35; padding-bottom:16px;">
      <button class="back-btn" data-action="marketplace">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>Listing Details</h2>
    </div>
    <div style="background:#e0ede4; height:200px; display:flex; align-items:center; justify-content:center;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#aabdae" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    </div>
    <div style="padding:20px; background:#fff; border-radius:0 0 24px 24px; box-shadow:0 4px 12px rgba(0,0,0,0.04); margin-bottom:12px;">
      <h3 style="font-size:22px; font-weight:800; color:#0a1a0f; margin:0 0 6px;">${m.title}</h3>
      <div style="font-size:20px; font-weight:700; color:#1d6b35; margin-bottom:14px;">${m.price}</div>
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px;">
        ${m.tags.map(t => `<span class="market-tag ${t.cls}">${t.label}</span>`).join('')}
      </div>
      <div style="font-size:13px; color:#5a7a62; line-height:1.5;">
        Available Quantity: <strong>${m.qty}</strong><br>
        Location: <strong>${m.loc}</strong>
      </div>
    </div>
    <div style="background:#fff; border-radius:24px; box-shadow:0 4px 12px rgba(0,0,0,0.04); margin:0 12px 12px; overflow:hidden;">
      <div style="padding:16px 20px 0;">
        <h4 style="font-size:14px; font-weight:700; color:#1a3320; margin:0 0 4px; display:flex; align-items:center; gap:6px;">
          📍 Seller Location
        </h4>
      </div>
      ${m.lat != null && m.lng != null
        ? `<div id="seller-map" style="height:200px; margin-top:8px;"></div>`
        : `<div style="padding:24px 20px; text-align:center; color:#8aa691; font-size:13px;">Location pin not available for this listing.</div>`
      }
    </div>
    <div style="padding:20px; background:#fff; border-radius:24px; box-shadow:0 4px 12px rgba(0,0,0,0.04); margin:0 12px;">
      <h4 style="font-size:14px; font-weight:700; color:#1a3320; margin:0 0 10px;">About the Seller</h4>
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:44px; height:44px; border-radius:50%; background:#1d6b35; display:flex; align-items:center; justify-content:center; font-size:20px; color:#fff;">👨‍🌾</div>
        <div>
          <div style="font-size:14px; font-weight:600; color:#0a1a0f;">${m.seller.split('·')[0].trim()}</div>
          <div style="font-size:12px; color:#6b8f72;">Verified AgriSphere Member</div>
        </div>
      </div>
    </div>
    <div style="padding:20px 20px 40px; text-align:center;">
      <button class="action-btn-primary" data-action="market-chat" style="width:100%; max-width:300px; background:#1d6b35; color:#fff; border:none; padding:16px; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgba(29,107,53,0.3);">
        Message Seller
      </button>
    </div>
  </div>`
}

function bindMarketDetailEvents() {
  const m = currentMarketItem || marketListings[0]
  if (!m || m.lat == null || m.lng == null) return

  const sellerName = m.seller.split('·')[0].replace('Farmer: ', '').replace('Processor: ', '').replace('Cooperative: ', '').trim()
  renderSellerMap('seller-map', m.lat, m.lng, `<strong>${sellerName}</strong><br>${m.title}`)
}

// ── Render: Marketplace Chat ────────────────────────────────────────────────────
function renderMarketChat() {
  const m = currentMarketItem || marketListings[0]
  const sellerName = m.seller.split('·')[0].replace('Farmer: ', '').replace('Processor: ', '').replace('Cooperative: ', '').trim()
  return `
  <div class="view" style="background:#f8fbf9; min-height:100%; display:flex; flex-direction:column;">
    <div class="view-header" style="background:#1d6b35; padding-bottom:16px; flex-shrink:0;">
      <button class="back-btn" data-action="marketplace">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:36px; height:36px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; font-size:18px;">👨‍🌾</div>
        <div style="display:flex; flex-direction:column;">
          <span style="font-size:16px; font-weight:700; color:#fff;">${sellerName}</span>
          <span style="font-size:11px; color:rgba(255,255,255,0.7);">Online now</span>
        </div>
      </div>
    </div>
    <div id="mchat-body" style="flex:1; padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:16px;">
      <div style="background:#e4f5ea; border:1px solid #c3e2cc; border-radius:12px; padding:12px; display:flex; align-items:center; gap:12px;">
        <div style="width:40px; height:40px; background:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center;">📦</div>
        <div style="flex:1;">
          <div style="font-size:12px; color:#5a7a62;">Inquiring about:</div>
          <div style="font-size:14px; font-weight:700; color:#1d6b35;">${m.title} - ${m.price}</div>
        </div>
      </div>
      <div style="display:flex; gap:10px; align-items:flex-end;">
        <div style="width:28px; height:28px; border-radius:50%; background:#1d6b35; display:flex; align-items:center; justify-content:center; font-size:14px;">👨‍🌾</div>
        <div style="background:#fff; border:1px solid #e0ede4; padding:12px 16px; border-radius:18px 18px 18px 4px; font-size:14px; color:#0a1a0f; box-shadow:0 2px 6px rgba(0,0,0,0.02); max-width:80%;">
          Hi! I saw you're interested in my listing. Are you looking to pick it up this week?
        </div>
      </div>
    </div>
    <div style="background:#fff; border-top:1px solid #e0ede4; padding:12px 20px 20px; display:flex; align-items:center; gap:12px; flex-shrink:0;">
      <button style="width:40px; height:40px; border-radius:50%; background:#f0f8f2; border:none; display:flex; align-items:center; justify-content:center; color:#1d6b35; cursor:pointer; flex-shrink:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <input type="text" id="mchat-input" placeholder="Type a message..." style="flex:1; background:#f4f7f5; border:1px solid #d1dfd5; padding:12px 16px; border-radius:24px; font-size:14px; color:#0a1a0f; outline:none;" />
      <button id="mchat-send" style="width:40px; height:40px; border-radius:50%; background:#1d6b35; border:none; display:flex; align-items:center; justify-content:center; color:#fff; cursor:pointer; flex-shrink:0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:translateX(-1px);"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
  </div>`
}

function bindMarketChatEvents() {
  const input = document.getElementById('mchat-input')
  const body = document.getElementById('mchat-body')
  const sendBtn = document.getElementById('mchat-send')
  if (!input || !body || !sendBtn) return

  const sendMessage = () => {
    const text = input.value.trim()
    if (!text) return

    body.insertAdjacentHTML('beforeend', `
      <div style="display:flex; gap:12px; align-items:flex-end; flex-direction:row-reverse;">
        <div style="background:#1d6b35; padding:12px 16px; border-radius:16px 16px 4px 16px; box-shadow:0 2px 8px rgba(29,107,53,0.1); max-width:80%; font-size:14px; color:#fff; line-height:1.5;">
          ${escapeHtml(text)}
        </div>
      </div>`)

    input.value = ''
    body.scrollTop = body.scrollHeight
    showToast('✅ Message sent!')
  }

  sendBtn.addEventListener('click', sendMessage)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage()
  })
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// ── Render: Marketplace Create Listing ──────────────────────────────────────────
function renderMarketCreate() {
  return `
  <div class="view" style="background:#f4f7f5; min-height:100%;">
    <div class="view-header" style="background:#1d6b35; padding-bottom:16px;">
      <button class="back-btn" data-action="marketplace">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>List an Item</h2>
    </div>
    <div style="padding:20px;">
      <div class="form-group">
        <label class="form-label">Title / Item Name</label>
        <input type="text" class="form-input" id="mc-title" placeholder="e.g. Dry Rice Straw">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="mc-category">
          <option>Crop Waste</option>
          <option>Manure</option>
          <option>Biochar</option>
          <option>Compost</option>
          <option>Feed Additive</option>
        </select>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label">Price (₱)</label>
          <input type="number" class="form-input" id="mc-price" placeholder="0.00">
        </div>
        <div class="form-group">
          <label class="form-label">Unit</label>
          <select class="form-select" id="mc-unit">
            <option>per ton</option>
            <option>per sack</option>
            <option>per bag</option>
            <option>per kg</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Available Quantity</label>
        <input type="text" class="form-input" id="mc-qty" placeholder="e.g. 5 tons">
      </div>
      <div class="form-group">
        <label class="form-label">Location / Pickup details</label>
        <input type="text" class="form-input" id="mc-location" placeholder="e.g. Tagum City, near public market" value="${userLocation.location}">
      </div>
      <div class="form-group">
        <label class="form-label">Add Photos</label>
        <div style="height:90px; border:2px dashed #b5cdbe; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#1d6b35; background:#eef7f1; cursor:pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span style="margin-left:8px; font-weight:600; font-size:14px;">Upload Image</span>
        </div>
      </div>
      <p id="mc-error" style="color:#c0392b; font-size:13px; display:none; margin-top:4px;"></p>
      <button id="mc-submit" style="width:100%; background:#1d6b35; color:#fff; border:none; padding:16px; border-radius:14px; font-size:15px; font-weight:700; margin-top:12px; cursor:pointer; box-shadow:0 4px 14px rgba(29,107,53,0.3);">
        Publish Listing
      </button>
      <div style="height:32px"></div>
    </div>
  </div>`
}

function bindMarketCreateEvents() {
  document.getElementById('mc-submit')?.addEventListener('click', () => {
    const title = document.getElementById('mc-title').value.trim()
    const category = document.getElementById('mc-category').value
    const price = document.getElementById('mc-price').value.trim()
    const unit = document.getElementById('mc-unit').value
    const qty = document.getElementById('mc-qty').value.trim()
    const location = document.getElementById('mc-location').value.trim() || userLocation.location
    const errorEl = document.getElementById('mc-error')

    if (!title || !price || !qty) {
      errorEl.textContent = 'Please fill in the item name, price, and quantity.'
      errorEl.style.display = 'block'
      return
    }
    errorEl.style.display = 'none'

    const listing = {
      title,
      price: `₱${price}/${unit.replace('per ', '')}`,
      seller: 'Farmer: You · ' + location,
      qty,
      tags: [{ label: category, cls: '' }],
      loc: `${location}, 0km`,
      distance: '0km',
      lat: userLocation.lat,
      lng: userLocation.lng,
    }

    marketListings = addMarketListing(listing)
    showToast('✅ Listing published successfully!')
    setTimeout(() => navigateTo('marketplace'), 800)
  })
}

// ── Render: Marketplace Filter ──────────────────────────────────────────────────
function renderMarketFilter() {
  return `
  <div class="view" style="background:#f4f7f5; min-height:100%;">
    <div class="view-header" style="background:#1d6b35; padding-bottom:16px;">
      <button class="back-btn" data-action="marketplace">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>Advanced Filters</h2>
    </div>
    <div style="padding:20px;">
      <div class="form-group">
        <label class="form-label">Location</label>
        <div style="position:relative;">
          <svg style="position:absolute; left:14px; top:14px; opacity:0.5;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d6b35" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <input type="text" class="form-input" style="padding-left:40px;" placeholder="Search location" value="Tagum City">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Search Radius</label>
        <select class="form-select">
          <option>Within 5 km</option>
          <option selected>Within 15 km</option>
          <option>Within 50 km</option>
          <option>Anywhere</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Price Range (₱)</label>
        <div style="display:flex; gap:12px; align-items:center;">
          <input type="number" class="form-input" placeholder="Min">
          <span style="color:#6b8f72; font-weight:bold;">–</span>
          <input type="number" class="form-input" placeholder="Max">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Certifications</label>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:8px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:14px; color:#1a3320; cursor:pointer;">
            <input type="checkbox" style="width:18px; height:18px; accent-color:#1d6b35;"> Organic Certified
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:14px; color:#1a3320; cursor:pointer;">
            <input type="checkbox" style="width:18px; height:18px; accent-color:#1d6b35;"> LGU Verified Seller
          </label>
        </div>
      </div>
      <button style="width:100%; background:#1d6b35; color:#fff; border:none; padding:16px; border-radius:14px; font-size:15px; font-weight:700; margin-top:20px; cursor:pointer; box-shadow:0 4px 14px rgba(29,107,53,0.3);" onclick="showToast('✅ Filters applied'); setTimeout(() => navigateTo('marketplace'), 800)">
        Apply Filters
      </button>
      <div style="height:32px"></div>
    </div>
  </div>`
}

// ── Render: Profile ───────────────────────────────────────────────────────────
function renderProfile() {
  const menuItems = [
    { icon: '🌾', title: 'My Farm Profile', sub: 'Tagum City · 2.4 hectares' },
    { icon: '📋', title: 'My Waste Listings', sub: '3 active · 8 completed' },
    { icon: '🤝', title: 'Transaction History', sub: '₱48,200 earned lifetime' },
    { icon: '🏅', title: 'Certifications', sub: 'Organic · LGU Verified' },
    { icon: '⚙️', title: 'Settings', sub: 'Notifications · Language' },
  ]
  return `
  <div class="view">
    <div class="profile-avatar-section">
      <div class="profile-avatar">👨‍🌾</div>
      <div class="profile-name">Juan Dela Cruz</div>
      <div class="profile-role">Verified Farmer</div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat">
        <div class="profile-stat-val">12.4t</div>
        <div class="profile-stat-lbl">Waste Diverted</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-val">₱48K</div>
        <div class="profile-stat-lbl">Income</div>
      </div>
      <div class="profile-stat">
        <div class="profile-stat-val">11</div>
        <div class="profile-stat-lbl">Transactions</div>
      </div>
    </div>
    <div class="profile-section-title">My Account</div>
    <div class="profile-menu">
      ${menuItems.map(m => `
      <div class="profile-menu-item" data-action="profile-item">
        <div class="profile-menu-icon"><span style="font-size:18px">${m.icon}</span></div>
        <div class="profile-menu-text">
          <strong>${m.title}</strong>
          <span>${m.sub}</span>
        </div>
        <svg class="profile-menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </div>`).join('')}
    </div>
    <div style="height:16px"></div>
  </div>`
}

// ── Global Event Binding ──────────────────────────────────────────────────────
function bindViewEvents() {
  const app = document.getElementById('app')

  app.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', e => {
      const action = el.dataset.action
      const cropIndex = el.dataset.cropIndex

      // Recommendations list -> Detail: we already have the full object,
      // no fetch needed, just pass it straight to navigateTo.
      if (cropIndex !== undefined && recommendedCrops) {
        const crop = recommendedCrops[parseInt(cropIndex, 10)]
        if (crop) {
          navigateTo('detail', crop)
          return
        }
      }
      if (action === 'retry-recommendations' || action === 'refresh-recommendations') {
        loadRecommendations(true) // forceRefresh = true, bypasses cache
        return
      }
      if (action === 'profile-item') {
        showToast('✅ Feature coming in v2!')
        return
      }
      if (action === 'marketplace-detail') {
        const titleEl = el.querySelector('.market-card-title')
        if (titleEl) {
          const title = titleEl.innerText
          currentMarketItem = marketListings.find(m => m.title === title) || marketListings[0]
        }
        navigateTo('market-detail')
        return
      }
      if (action === 'ai-chat') {
        pendingChatAutoPrompt = el.dataset.prompt || null
        navigateTo('ai-chat')
        return
      }
      if (VALID_VIEWS.includes(action)) {
        navigateTo(action)
      }
    })
  })

  document.getElementById('opp-dismiss')?.addEventListener('click', e => {
    e.stopPropagation()
    const card = document.getElementById('opp-card')
    if (card) {
      card.style.transition = 'all 0.3s ease'
      card.style.opacity = '0'
      card.style.transform = 'scale(0.95) translateY(-8px)'
      card.style.maxHeight = card.offsetHeight + 'px'
      setTimeout(() => {
        card.style.maxHeight = '0'
        card.style.padding = '0'
        card.style.margin = '0'
        card.style.overflow = 'hidden'
      }, 200)
    }
  })

  app.querySelectorAll('.news-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      clearNewsInterval()
      currentNewsIdx = parseInt(dot.dataset.dot)
      updateNewsSlider()
      newsInterval = setInterval(() => {
        currentNewsIdx = (currentNewsIdx + 1) % NEWS.length
        updateNewsSlider()
      }, 3500)
    })
  })

  app.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      app.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
    })
  })

  app.querySelectorAll('.market-contact-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const card = btn.closest('.market-card')
      if (card) {
        const titleEl = card.querySelector('.market-card-title')
        if (titleEl) {
          const title = titleEl.innerText
          currentMarketItem = marketListings.find(m => m.title === title) || marketListings[0]
        }
      }
      navigateTo('market-chat')
    })
  })

  enableDragScroll()
}

// ── Drag Scroll ───────────────────────────────────────────────────────────────
function enableDragScroll() {
  const sliders = document.querySelectorAll('.market-filter, .market-categories, .news-ticker-wrapper')
  sliders.forEach(slider => {
    let isDown = false
    let startX
    let scrollLeft

    slider.addEventListener('mousedown', e => {
      isDown = true
      startX = e.pageX - slider.offsetLeft
      scrollLeft = slider.scrollLeft
      slider.style.cursor = 'grabbing'
    })
    slider.addEventListener('mouseleave', () => {
      isDown = false
      slider.style.cursor = 'grab'
    })
    slider.addEventListener('mouseup', () => {
      isDown = false
      slider.style.cursor = 'grab'
    })
    slider.addEventListener('mousemove', e => {
      if (!isDown) return
      e.preventDefault()
      const x = e.pageX - slider.offsetLeft
      const walk = (x - startX) * 2
      slider.scrollLeft = scrollLeft - walk
    })
    slider.style.cursor = 'grab'
  })
}

const VALID_VIEWS = ['home', 'recommendations', 'ai-chat', 'scanner', 'scanner-crop', 'marketplace', 'market-detail', 'market-create', 'market-filter', 'market-chat', 'market-map', 'profile', 'detail']

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const existing = document.querySelector('.toast')
  if (existing) existing.remove()
  const t = document.createElement('div')
  t.className = 'toast'
  t.innerHTML = `<span>${msg}</span>`
  document.querySelector('.phone-screen').appendChild(t)
  setTimeout(() => t.remove(), 3000)
}

// Expose functions used by inline onclick="" handlers in the templates above
window.showToast = showToast
window.navigateTo = navigateTo
window.viewMarketplaceListingFromMap = (title) => {
  const listing = marketListings.find(m => m.title === title)
  if (listing) {
    currentMarketItem = listing
    navigateTo('market-detail')
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
init()