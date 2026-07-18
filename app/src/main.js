import './style.css'

// ── Mock Data ─────────────────────────────────────────────────────────────────
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

const CROPS = [
  {
    emoji: '🥭', bg: '#fff4e6',
    name: 'Mango',      local: 'Manga',
    month: 'Aug – Oct', demand: 'High Demand',   badge: 'badge-high',
    profit: '₱12,400/ha', risk: 'Low', match: 88,
    desc: 'Excellent climate match. Davao variety performs best in current humidity range.',
    supplyTrend: 'Tight supply — prices rising. Good time to plant.',
    effort: 'Moderate', days: '90–110 days to harvest',
  },
  {
    emoji: '🎃', bg: '#e8f5ed',
    name: 'Squash',     local: 'Kalabasa',
    month: 'Jul – Sep', demand: 'High Demand',   badge: 'badge-high',
    profit: '₱8,200/ha',  risk: 'Low', match: 84,
    desc: 'Short-cycle crop ideal for the current season. Grows well in loamy Tagum soils.',
    supplyTrend: 'Consistent demand in Davao City markets year-round.',
    effort: 'Low', days: '60–75 days to harvest',
  },
  {
    emoji: '🥥', bg: '#fef3f2',
    name: 'Coconut',    local: 'Niyog',
    month: 'Jun – Aug', demand: 'Stable',        badge: 'badge-med',
    profit: '₱6,800/ha',  risk: 'Med', match: 72,
    desc: 'Long-term perennial investment. Best for farms with stable water access.',
    supplyTrend: 'Copra prices stable. VCO market growing in Metro Manila.',
    effort: 'Low', days: 'Perennial — first harvest in 3–5 years',
  },
  {
    emoji: '🍌', bg: '#fff4e6',
    name: 'Banana',     local: 'Saging',
    month: 'Year-round',demand: 'Stable',        badge: 'badge-med',
    profit: '₱9,100/ha',  risk: 'Med', match: 78,
    desc: 'Cavendish variety preferred by exporters. High upfront input requirements.',
    supplyTrend: 'Export demand steady. Domestic oversupply risk in Q3.',
    effort: 'Moderate', days: '9–12 months to harvest',
  },
  {
    emoji: '🥦', bg: '#e8f5ed',
    name: 'Chayote',    local: 'Sayote',
    month: 'Aug – Nov', demand: 'Med Supply',    badge: 'badge-med',
    profit: '₱4,500/ha',  risk: 'Low', match: 66,
    desc: 'Highland variety can adapt to Tagum midland elevations. Simple trellis system needed.',
    supplyTrend: 'Niche vegetable with steady urban demand. Less competition.',
    effort: 'Low', days: '75–90 days to first harvest',
  },
]

const MARKET_ITEMS = [
  {
    title: 'Rice Straw (Dry)',
    price: '₱850/ton',
    seller: 'Farmer: Rodrigo M. · Tagum City',
    qty: '4.5 tons',
    tags: [{ label: 'Biochar-ready', cls: '' }, { label: 'Air-dried', cls: '' }, { label: 'Pickup avail.', cls: 'gray' }],
    loc: 'Tagum City, 2.3km',
    distance: '2.3km',
  },
  {
    title: 'Coconut Husk Chips',
    price: '₱1,200/bag',
    seller: 'Cooperative: AgriVerde · Carmen, Davao',
    qty: '60 bags (25kg each)',
    tags: [{ label: 'Compost', cls: '' }, { label: 'Coir fiber', cls: '' }, { label: 'Organic', cls: '' }],
    loc: 'Carmen, Davao, 8.1km',
    distance: '8.1km',
  },
  {
    title: 'Banana Stem Pulp',
    price: '₱320/sack',
    seller: 'Farmer: Elvie S. · Panabo City',
    qty: '12 sacks',
    tags: [{ label: 'Feed additive', cls: '' }, { label: 'Fresh', cls: 'orange' }, { label: 'Limited', cls: 'orange' }],
    loc: 'Panabo City, 14.5km',
    distance: '14.5km',
  },
  {
    title: 'Chicken Manure (Processed)',
    price: '₱600/bag',
    seller: 'Processor: GreenFarm Hub · Sto. Tomas',
    qty: '30 bags (50kg each)',
    tags: [{ label: 'Fertilizer', cls: '' }, { label: 'Composted', cls: '' }, { label: 'Certified', cls: '' }],
    loc: 'Sto. Tomas, Davao, 18.2km',
    distance: '18.2km',
  },
]

// ── Router State ──────────────────────────────────────────────────────────────
let currentView = 'home'
let currentCrop = null
let currentMarketItem = null
let currentNewsIdx = 0
let newsInterval = null
let scanState = 'idle' // idle | scanning | result

// ── App Init ──────────────────────────────────────────────────────────────────
function init() {
  updateStatusTime()
  setInterval(updateStatusTime, 30000)
  bindNavigation()
  navigateTo('home')
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

function navigateTo(view, data = null) {
  currentView = view
  if (data) currentCrop = data

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === view)
  })

  // Show/hide bottom nav
  const nav = document.getElementById('bottom-nav')
  nav.style.display = view === 'detail' ? 'none' : 'flex'

  // Render
  const app = document.getElementById('app')
  clearNewsInterval()

  switch(view) {
    case 'home':            app.innerHTML = renderHome(); startNewsSlider(); break
    case 'recommendations': app.innerHTML = renderRecommendations(); break
    case 'ai-chat':         app.innerHTML = renderAIChat(); break
    case 'scanner':         scanState = 'idle'; app.innerHTML = renderScanner(); bindScannerEvents(); break
    case 'scanner-crop':    scanState = 'idle'; app.innerHTML = renderScannerCrop(); bindScannerCropEvents(); break
    case 'marketplace':     app.innerHTML = renderMarketplace(); break
    case 'market-detail':   app.innerHTML = renderMarketplaceDetail(); break
    case 'market-create':   app.innerHTML = renderMarketCreate(); break
    case 'market-filter':   app.innerHTML = renderMarketFilter(); break
    case 'market-chat':     app.innerHTML = renderMarketChat(); break
    case 'profile':         app.innerHTML = renderProfile(); break
    case 'detail':          app.innerHTML = renderDetail(); break
    default:                app.innerHTML = renderHome(); startNewsSlider()
  }

  bindViewEvents()
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
        Tagum City, PH
      </div>
    </div>

    <!-- News Section -->
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
      ${NEWS.map((_, i) => `<div class="news-dot ${i===0?'active':''}" data-dot="${i}"></div>`).join('')}
    </div>

    <!-- Action Cards -->
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

    <!-- Stats Strip -->
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

    <!-- Circular Impact Card -->
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

    <!-- Today's Opportunity Card -->
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

// ── Render: Recommendations ───────────────────────────────────────────────────
function renderRecommendations() {
  return `
  <div class="view">
    <div class="view-header">
      <button class="back-btn" data-action="home">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>Best to Plant</h2>
    </div>
    <p class="view-subtitle">AI-ranked crops for Tagum City · Based on temperature &amp; market data</p>
    <div class="crop-list">
      ${CROPS.map((c, i) => `
      <div class="crop-card" style="animation-delay: ${i*0.08}s" data-action="detail" data-crop="${c.name}">
        <div class="crop-icon-wrap" style="background: ${c.bg}">${c.emoji}</div>
        <div class="crop-info">
          <div class="crop-name">${c.name} <span class="crop-local">(${c.local})</span></div>
          <div class="crop-stats">
            <span class="crop-stat-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${c.month}
            </span>
            <span class="crop-stat-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              ${c.price || c.profit.split('/')[0]}
            </span>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
          <div class="badge ${c.badge}">${c.demand}</div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aabdae" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>`).join('')}
    </div>
    <div style="height:30px"></div>
  </div>`
}

// ── Render: AI Chat ───────────────────────────────────────────────────────────
function renderAIChat() {
  return `
  <div class="view" style="background:#f4f7f5; display:flex; flex-direction:column; min-height:100%;">
    <div class="view-header" style="background:#1d6b35; padding:16px 20px 20px; flex-shrink:0;">
      <h2 style="font-size:24px; font-weight:800;">AgriAI Assistant</h2>
      <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:4px;">Ask me anything about farming & waste</div>
    </div>
    
    <div style="flex:1; padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:16px;">
      
      <!-- AI Message -->
      <div style="display:flex; gap:12px;">
        <div style="width:32px; height:32px; border-radius:50%; background:#1d6b35; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path><path d="M22 12a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z"></path><path d="M12 22a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v2a2 2 0 0 1-2 2z"></path><path d="M2 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"></path></svg>
        </div>
        <div style="background:#fff; padding:12px 16px; border-radius:4px 16px 16px 16px; box-shadow:0 2px 8px rgba(0,0,0,0.03); max-width:85%; font-size:14px; color:#1a3320; line-height:1.5;">
          Hello! I'm AgriAI. How can I help you today? I can recommend crops, analyze market trends, or suggest ways to process agricultural waste.
        </div>
      </div>
      
      <!-- User Message Placeholder -->
      <div style="display:none; gap:12px; align-items:flex-end; flex-direction:row-reverse; margin-top:8px;" id="ai-chat-user-msg">
        <div style="background:#1d6b35; padding:12px 16px; border-radius:16px 16px 4px 16px; box-shadow:0 2px 8px rgba(29,107,53,0.1); max-width:85%; font-size:14px; color:#fff; line-height:1.5;">
          What is the best way to process Rice Straw?
        </div>
      </div>

    </div>

    <!-- Chat Input Area -->
    <div style="background:#fff; border-top:1px solid #e0ede4; padding:16px 20px 30px; display:flex; align-items:center; gap:12px; flex-shrink:0;">
      <input type="text" placeholder="Ask AgriAI..." style="flex:1; background:#f4f7f5; border:1px solid #d1dfd5; padding:14px 16px; border-radius:24px; font-size:15px; color:#0a1a0f; outline:none;" />
      <button style="width:44px; height:44px; border-radius:50%; background:#1d6b35; border:none; display:flex; align-items:center; justify-content:center; color:#fff; cursor:pointer; flex-shrink:0; box-shadow:0 4px 12px rgba(29,107,53,0.3);" onclick="showToast('💬 AI Chat is in demo mode.')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:translateX(-1px);"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
  </div>`
}

// ── Render: Scanner ───────────────────────────────────────────────────────────
function renderScanner() {
  return `
  <div class="view scanner-view">
    <div class="scanner-header">
      <h2>AI Crop Scanner</h2>
      <p>Identify waste or assess crop risk using your camera</p>
    </div>

    <div class="scanner-frame" id="scanner-frame">
      <div class="scanner-corners"><span></span></div>
      <div class="scanner-line"></div>
      <svg class="scan-placeholder-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span class="scan-placeholder-text">Point camera at crop or waste</span>
    </div>
    <p class="scanner-label">Supports rice straw, corn stalks, banana waste &amp; more</p>

    <div class="scanner-actions">
      <button class="scanner-btn-primary" id="btn-scan">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        Scan Now
      </button>
      <button class="scanner-btn-secondary" id="btn-upload">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Upload
      </button>
    </div>
    <div id="scan-result-area"></div>
    <div style="height:16px"></div>
  </div>`
}

function bindScannerEvents() {
  document.getElementById('btn-scan')?.addEventListener('click', startScan)
  document.getElementById('btn-upload')?.addEventListener('click', startScan)
}

function startScan() {
  const frame = document.getElementById('scanner-frame')
  if (!frame || scanState === 'scanning') return
  scanState = 'scanning'

  // Show processing overlay
  const overlay = document.createElement('div')
  overlay.className = 'scan-processing'
  overlay.innerHTML = `
    <div class="scan-spinner"></div>
    <div class="scan-processing-text">Analyzing biomass...</div>
    <div class="scan-processing-sub">Matching with crop database</div>
  `
  frame.appendChild(overlay)

  setTimeout(() => {
    const txt = overlay.querySelector('.scan-processing-text')
    if (txt) txt.textContent = 'Calculating value pathways...'
  }, 1000)

  setTimeout(() => {
    overlay.remove()
    scanState = 'result'
    document.getElementById('scan-result-area').innerHTML = `
    <div class="scan-result">
      <div class="scan-result-header">
        <span class="scan-result-icon">🌾</span>
        <div>
          <div class="scan-result-name">Rice Straw Identified</div>
          <span class="scan-result-quality">High Quality · 92% Confidence</span>
        </div>
      </div>

      <!-- Two toggle tab cards -->
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

      <!-- Tab content panels -->
      <div class="scan-panel" id="panel-wtv">
        <div class="scan-panel-row">
          <span class="scan-panel-emoji">⚫</span>
          <div class="scan-panel-info">
            <div class="scan-panel-title">Biochar <span class="scan-best-tag">BEST</span></div>
            <div class="scan-panel-desc">High carbon value · Low effort · Ready in 3 days</div>
          </div>
          <div class="scan-panel-val">₱6,200</div>
        </div>
        <div class="scan-panel-row">
          <span class="scan-panel-emoji">🍄</span>
          <div class="scan-panel-info">
            <div class="scan-panel-title">Mushroom Farm Substrate</div>
            <div class="scan-panel-desc">Buyer matched 4.2km away · Fast pickup</div>
          </div>
          <div class="scan-panel-val">₱4,500</div>
        </div>
        <div class="scan-panel-row">
          <span class="scan-panel-emoji">🌿</span>
          <div class="scan-panel-info">
            <div class="scan-panel-title">Compost</div>
            <div class="scan-panel-desc">Lowest effort · Moderate return</div>
          </div>
          <div class="scan-panel-val">₱3,500</div>
        </div>
      </div>

      <div class="scan-panel hidden" id="panel-pp">
        <div class="scan-panel-row">
          <span class="scan-panel-emoji">🧱</span>
          <div class="scan-panel-info">
            <div class="scan-panel-title">Biochar Briquettes</div>
            <div class="scan-panel-desc">Compressed fuel blocks · High demand in urban areas</div>
          </div>
          <div class="scan-panel-val">₱8,400</div>
        </div>
        <div class="scan-panel-row">
          <span class="scan-panel-emoji">🌱</span>
          <div class="scan-panel-info">
            <div class="scan-panel-title">Organic Fertilizer Mix</div>
            <div class="scan-panel-desc">Blended compost · Sell to nurseries &amp; gardens</div>
          </div>
          <div class="scan-panel-val">₱3,800</div>
        </div>
        <div class="scan-panel-row">
          <span class="scan-panel-emoji">🥩</span>
          <div class="scan-panel-info">
            <div class="scan-panel-title">Animal Feed Additive</div>
            <div class="scan-panel-desc">Processed straw silage · Livestock-ready</div>
          </div>
          <div class="scan-panel-val">₱2,900</div>
        </div>
      </div>
    </div>`

    // Tab toggle logic
    document.querySelectorAll('.scan-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'))
        document.querySelectorAll('.scan-panel').forEach(p => p.classList.add('hidden'))
        tab.classList.add('active')
        document.getElementById('panel-' + tab.dataset.tab).classList.remove('hidden')
      })
    })

    bindViewEvents()
  }, 2200)
}

// ── Render: Scanner Crop (Risk Analyzer) ────────────────────────────────────────
function renderScannerCrop() {
  return `
  <div class="view scanner-view">
    <div class="scanner-header">
      <h2>Crop Risk Analyzer</h2>
      <p>Scan crops to evaluate climate fit and market risk</p>
    </div>

    <div class="scanner-frame" id="scanner-frame-crop">
      <div class="scanner-corners"><span></span></div>
      <div class="scanner-line"></div>
      <svg class="scan-placeholder-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span class="scan-placeholder-text">Point camera at growing crop</span>
    </div>
    <p class="scanner-label">Ensure the leaves and fruit (if any) are clearly visible.</p>

    <div class="scanner-actions">
      <button class="scanner-btn-primary" id="btn-scan-crop">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        Scan Now
      </button>
      <button class="scanner-btn-secondary" id="btn-upload-crop">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Upload
      </button>
    </div>
    <div id="scan-result-area-crop"></div>
    <div style="height:16px"></div>
  </div>`
}

function bindScannerCropEvents() {
  document.getElementById('btn-scan-crop')?.addEventListener('click', startScanCrop)
  document.getElementById('btn-upload-crop')?.addEventListener('click', startScanCrop)
}

function startScanCrop() {
  const frame = document.getElementById('scanner-frame-crop')
  if (!frame || scanState === 'scanning') return
  scanState = 'scanning'

  // Show processing overlay
  const overlay = document.createElement('div')
  overlay.className = 'scan-processing'
  overlay.innerHTML = `
    <div class="scan-spinner"></div>
    <div class="scan-processing-text">Analyzing plant features...</div>
    <div class="scan-processing-sub">Matching with crop database</div>
  `
  frame.appendChild(overlay)

  setTimeout(() => {
    const txt = overlay.querySelector('.scan-processing-text')
    if (txt) txt.textContent = 'Pulling market data...'
  }, 1000)

  setTimeout(() => {
    overlay.remove()
    scanState = 'result'
    const resultArea = document.getElementById('scan-result-area-crop')
    if(resultArea) {
      resultArea.innerHTML = `
      <div class="scan-result">
        <div class="scan-result-header">
          <span class="scan-result-icon">🥭</span>
          <div>
            <div class="scan-result-name">Mango Identified</div>
            <span class="scan-result-quality">Davao Variety · 98% Confidence</span>
          </div>
        </div>
        <p style="font-size:12px; color:#5a7a62; margin-top:8px;">Analyzing risk factors and climate match...</p>
      </div>`
    }

    // Redirect to detail view after short delay
    setTimeout(() => {
      const mango = CROPS.find(c => c.name === 'Mango')
      if (mango) navigateTo('detail', mango)
    }, 1200)

  }, 2200)
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
      <button class="back-btn" data-action="market-filter" style="flex-shrink:0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
      </button>
    </div>
    <div class="market-filter">
      ${filters.map((f,i) => `<button class="filter-chip ${i===0?'active':''}" data-filter="${f}">${f}</button>`).join('')}
    </div>
    <div class="market-list">
      ${MARKET_ITEMS.map(m => `
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
    
    <!-- Floating Action Button -->
    <button class="fab-btn" data-action="market-create">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
    </button>
    
    <div style="height:16px"></div>
  </div>`
}

// ── Render: Marketplace Detail ──────────────────────────────────────────────────
function renderMarketplaceDetail() {
  const m = currentMarketItem || MARKET_ITEMS[0]
  return `
  <div class="view" style="background:#f4f7f5; min-height:100%;">
    <div class="view-header" style="background:#1d6b35; padding-bottom:16px;">
      <button class="back-btn" data-action="marketplace">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>Listing Details</h2>
    </div>

    <!-- Product Image Placeholder -->
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

// ── Render: Marketplace Chat ────────────────────────────────────────────────────
function renderMarketChat() {
  const m = currentMarketItem || MARKET_ITEMS[0]
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

    <!-- Chat Body -->
    <div style="flex:1; padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:16px;">
      
      <!-- System Item summary -->
      <div style="background:#e4f5ea; border:1px solid #c3e2cc; border-radius:12px; padding:12px; display:flex; align-items:center; gap:12px;">
        <div style="width:40px; height:40px; background:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center;">📦</div>
        <div style="flex:1;">
          <div style="font-size:12px; color:#5a7a62;">Inquiring about:</div>
          <div style="font-size:14px; font-weight:700; color:#1d6b35;">${m.title} - ${m.price}</div>
        </div>
      </div>

      <!-- Seller Message -->
      <div style="display:flex; gap:10px; align-items:flex-end;">
        <div style="width:28px; height:28px; border-radius:50%; background:#1d6b35; display:flex; align-items:center; justify-content:center; font-size:14px;">👨‍🌾</div>
        <div style="background:#fff; border:1px solid #e0ede4; padding:12px 16px; border-radius:18px 18px 18px 4px; font-size:14px; color:#0a1a0f; box-shadow:0 2px 6px rgba(0,0,0,0.02); max-width:80%;">
          Hi! I saw you're interested in my listing. Are you looking to pick it up this week?
        </div>
      </div>
      
    </div>

    <!-- Chat Footer -->
    <div style="background:#fff; border-top:1px solid #e0ede4; padding:12px 20px 20px; display:flex; align-items:center; gap:12px; flex-shrink:0;">
      <button style="width:40px; height:40px; border-radius:50%; background:#f0f8f2; border:none; display:flex; align-items:center; justify-content:center; color:#1d6b35; cursor:pointer; flex-shrink:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
      <input type="text" placeholder="Type a message..." style="flex:1; background:#f4f7f5; border:1px solid #d1dfd5; padding:12px 16px; border-radius:24px; font-size:14px; color:#0a1a0f; outline:none;" />
      <button style="width:40px; height:40px; border-radius:50%; background:#1d6b35; border:none; display:flex; align-items:center; justify-content:center; color:#fff; cursor:pointer; flex-shrink:0;" onclick="showToast('✅ Message sent!')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform:translateX(-1px);"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
  </div>`
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
        <input type="text" class="form-input" placeholder="e.g. Dry Rice Straw">
      </div>

      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select">
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
          <input type="number" class="form-input" placeholder="0.00">
        </div>
        <div class="form-group">
          <label class="form-label">Unit</label>
          <select class="form-select">
            <option>per ton</option>
            <option>per sack</option>
            <option>per bag</option>
            <option>per kg</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Available Quantity</label>
        <input type="text" class="form-input" placeholder="e.g. 5 tons">
      </div>

      <div class="form-group">
        <label class="form-label">Location / Pickup details</label>
        <input type="text" class="form-input" placeholder="e.g. Tagum City, near public market" value="Tagum City">
      </div>

      <div class="form-group">
        <label class="form-label">Add Photos</label>
        <div style="height:90px; border:2px dashed #b5cdbe; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#1d6b35; background:#eef7f1; cursor:pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span style="margin-left:8px; font-weight:600; font-size:14px;">Upload Image</span>
        </div>
      </div>

      <button style="width:100%; background:#1d6b35; color:#fff; border:none; padding:16px; border-radius:14px; font-size:15px; font-weight:700; margin-top:12px; cursor:pointer; box-shadow:0 4px 14px rgba(29,107,53,0.3);" onclick="showToast('✅ Listing published successfully!'); setTimeout(() => navigateTo('marketplace'), 1000)">
        Publish Listing
      </button>
      <div style="height:32px"></div>
    </div>
  </div>`
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
    { icon: '🌾', title: 'My Farm Profile',    sub: 'Tagum City · 2.4 hectares' },
    { icon: '📋', title: 'My Waste Listings',  sub: '3 active · 8 completed' },
    { icon: '🤝', title: 'Transaction History', sub: '₱48,200 earned lifetime' },
    { icon: '🏅', title: 'Certifications',      sub: 'Organic · LGU Verified' },
    { icon: '⚙️', title: 'Settings',            sub: 'Notifications · Language' },
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

// ── Render: Detail ────────────────────────────────────────────────────────────
function renderDetail() {
  const c = currentCrop || CROPS[0]
  return `
  <div class="view">
    <div class="view-header">
      <button class="back-btn" data-action="recommendations">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <h2>Crop Details</h2>
    </div>
    <div style="margin:0 20px">
      <div class="detail-hero">${c.emoji}</div>
    </div>
    <div class="detail-body">
      <div class="detail-name">${c.name} <span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.45)">(${c.local})</span></div>
      <div class="detail-local">${c.desc}</div>
      <div class="detail-cards">
        <div class="detail-card">
          <div class="detail-card-title">📊 Climate Match</div>
          <div class="detail-row">
            <span class="detail-row-label">Temperature Fit</span>
            <span class="detail-row-value">${c.match}%</span>
          </div>
          <div class="detail-bar"><div class="detail-bar-fill" style="width:${c.match}%"></div></div>
          <div class="detail-row mt-8">
            <span class="detail-row-label">Best Plant Month</span>
            <span class="detail-row-value">${c.month}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row-label">Harvest Window</span>
            <span class="detail-row-value">${c.days}</span>
          </div>
        </div>
        <div class="detail-card">
          <div class="detail-card-title">💹 Market Analysis</div>
          <div class="detail-row">
            <span class="detail-row-label">Estimated Profit</span>
            <span class="detail-row-value" style="color:#1d6b35;font-size:15px;font-weight:800">${c.profit}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row-label">Demand Level</span>
            <span class="detail-row-value">${c.demand}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row-label">Market Risk</span>
            <span class="detail-row-value">${c.risk}</span>
          </div>
          <div style="font-size:12px;color:#6b8f72;margin-top:8px;line-height:1.5;">${c.supplyTrend}</div>
        </div>
        <div class="detail-card">
          <div class="detail-card-title">⚙️ Effort &amp; Inputs</div>
          <div class="detail-row">
            <span class="detail-row-label">Effort Level</span>
            <span class="detail-row-value">${c.effort}</span>
          </div>
          <div class="detail-row">
            <span class="detail-row-label">Location</span>
            <span class="detail-row-value">Tagum City</span>
          </div>
        </div>
      </div>
      <button class="detail-action-btn" data-action="marketplace">
        🛒 Find Buyers &amp; Create Listing
      </button>
      <div style="height:24px"></div>
    </div>
  </div>`
}

// ── Global Event Binding ──────────────────────────────────────────────────────
function bindViewEvents() {
  const app = document.getElementById('app')

  // Action cards and buttons
  app.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', e => {
      const action = el.dataset.action
      const cropName = el.dataset.crop

      if (cropName) {
        currentCrop = CROPS.find(c => c.name === cropName) || CROPS[0]
        navigateTo('detail')
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
          currentMarketItem = MARKET_ITEMS.find(m => m.title === title) || MARKET_ITEMS[0]
        }
        navigateTo('market-detail')
        return
      }
      if (VALID_VIEWS.includes(action)) {
        navigateTo(action)
      }
    })
  })

  // Opportunity card dismiss
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

  // News dots
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

  // Market filters
  app.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      app.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
    })
  })

  // Contact seller from Marketplace cards
  app.querySelectorAll('.market-contact-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const card = btn.closest('.market-card')
      if (card) {
        const titleEl = card.querySelector('.market-card-title')
        if (titleEl) {
          const title = titleEl.innerText
          currentMarketItem = MARKET_ITEMS.find(m => m.title === title) || MARKET_ITEMS[0]
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
    // initial state
    slider.style.cursor = 'grab'
  })
}

const VALID_VIEWS = ['home','recommendations','ai-chat','scanner','scanner-crop','marketplace','market-detail','market-create','market-filter','market-chat','profile','detail']

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

// ── Start ─────────────────────────────────────────────────────────────────────
init()
