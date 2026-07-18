// ── Generic cache helpers ──────────────────────────────────────────────────
// Used so navigating away and back doesn't refetch — only an explicit
// "Refresh" click (or cache expiry) triggers a new network call.

const CACHE_PREFIX = 'agrisphere:cache:'

export const getCached = (key, ttlMs = 1000 * 60 * 60 * 6) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.savedAt > ttlMs) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return parsed.value
  } catch {
    return null
  }
}

export const setCached = (key, value) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, savedAt: Date.now() }))
  } catch {
    // Storage full or unavailable — fail silently, app still works without cache
  }
}

export const clearCached = (key) => {
  try {
    localStorage.removeItem(CACHE_PREFIX + key)
  } catch {
    // ignore
  }
}

// ── Marketplace listings ───────────────────────────────────────────────────
// Listings live entirely in localStorage on the frontend for this prototype
// (no backend marketplace endpoint yet). Seeded once with starter data.

const MARKET_KEY = 'agrisphere:marketListings'

export const seedMarketListings = (initialItems) => {
  const existing = localStorage.getItem(MARKET_KEY)
  if (existing) return // already seeded, don't overwrite user's real listings
  try {
    localStorage.setItem(MARKET_KEY, JSON.stringify(initialItems))
  } catch {
    // ignore
  }
}

export const getMarketListings = () => {
  try {
    const raw = localStorage.getItem(MARKET_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Patches lat/lng onto listings already sitting in localStorage from before
// the map feature existed. Matches by title against the current seed data —
// anything the user actually created themselves (which already has real
// coordinates) is left untouched.
export const migrateMarketListings = (seedItems) => {
  const listings = getMarketListings()
  if (listings.length === 0) return listings

  let changed = false
  const migrated = listings.map(listing => {
    if (listing.lat != null && listing.lng != null) return listing
    const match = seedItems.find(seed => seed.title === listing.title)
    if (match) {
      changed = true
      return { ...listing, lat: match.lat, lng: match.lng }
    }
    return listing
  })

  if (changed) {
    try {
      localStorage.setItem(MARKET_KEY, JSON.stringify(migrated))
    } catch {
      // ignore
    }
  }

  return migrated
}

export const addMarketListing = (listing) => {
  const listings = getMarketListings()
  listings.unshift(listing) // newest first
  try {
    localStorage.setItem(MARKET_KEY, JSON.stringify(listings))
  } catch {
    // ignore
  }
  return listings
}