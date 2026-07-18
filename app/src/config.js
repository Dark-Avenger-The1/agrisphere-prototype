export const API_BASE_URL = 'http://localhost:5000'

// Fallback used if the browser denies/lacks geolocation, or reverse
// geocoding fails — keeps the app usable even without GPS permission.
export const DEFAULT_LOCATION = { lat: 7.45, lng: 125.81, location: 'Tagum City' }

// Wraps navigator.geolocation in a Promise and reverse-geocodes the
// coordinates into a human-readable location name (e.g. "Tagum City")
// via OpenStreetMap's free Nominatim API, since the backend's AI prompts
// need a place name, not just raw lat/lng.
export const getUserLocation = () => {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(DEFAULT_LOCATION)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
          )
          const json = await res.json()
          const address = json.address || {}
          const locationName =
            address.city || address.town || address.municipality ||
            address.county || DEFAULT_LOCATION.location

          resolve({ lat, lng, location: locationName })
        } catch {
          // Reverse geocoding failed — still use the real coordinates,
          // just fall back to a generic label instead of a wrong city name.
          resolve({ lat, lng, location: DEFAULT_LOCATION.location })
        }
      },
      () => {
        // Permission denied, timeout, or position unavailable
        resolve(DEFAULT_LOCATION)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  })
}

export const apiFetch = async (path, params = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const response = await fetch(url.toString())
  const json = await response.json()

  if (!response.ok) {
    const error = new Error(json.error || 'Request failed')
    error.statusCode = response.status
    throw error
  }

  return json.data
}

// For endpoints that need a JSON body instead of query params (e.g. image
// uploads, which are far too large to put in a URL).
export const apiPost = async (path, body = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await response.json()

  if (!response.ok) {
    const error = new Error(json.error || 'Request failed')
    error.statusCode = response.status
    throw error
  }

  return json.data
}