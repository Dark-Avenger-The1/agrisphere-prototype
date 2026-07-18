import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Vite doesn't resolve Leaflet's default marker image paths correctly out
// of the box — this re-points them at the bundled asset URLs so the pin
// icon actually renders instead of showing a broken image.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

let mapInstance = null

// Renders a small map into the given container id, centered on the seller's
// pin. Always destroys any previous instance first — Leaflet throws if you
// try to re-initialize a map on a container that already has one attached,
// which happens naturally here since the DOM gets rebuilt on every navigation.
export const renderSellerMap = (containerId, lat, lng, popupLabel) => {
  destroySellerMap()

  const container = document.getElementById(containerId)
  if (!container || lat == null || lng == null) return

  mapInstance = L.map(containerId, {
    zoomControl: true,
    scrollWheelZoom: false, // avoid hijacking page scroll on a small embedded map
  }).setView([lat, lng], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(mapInstance)

  L.marker([lat, lng]).addTo(mapInstance).bindPopup(popupLabel).openPopup()
}

export const destroySellerMap = () => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
}

// Plots every listing with coordinates on one map, auto-framed to fit them
// all. Reuses the same singleton instance/cleanup as renderSellerMap since
// only one map is ever on screen at a time (different views).
export const renderAllSellersMap = (containerId, listings) => {
  destroySellerMap()

  const container = document.getElementById(containerId)
  if (!container) return

  const validListings = listings.filter(l => l.lat != null && l.lng != null)
  if (validListings.length === 0) return

  mapInstance = L.map(containerId, { zoomControl: true })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(mapInstance)

  const markers = validListings.map(listing => {
    const marker = L.marker([listing.lat, listing.lng]).addTo(mapInstance)
    const safeTitle = listing.title.replace(/'/g, "\\'")
    marker.bindPopup(`
      <div style="min-width:170px;">
        <strong>${listing.title}</strong><br>
        <span style="color:#1d6b35;font-weight:600;">${listing.price}</span><br>
        <span style="font-size:12px;color:#5a7a62;">${listing.loc}</span><br>
        <button onclick="window.viewMarketplaceListingFromMap('${safeTitle}')" style="margin-top:6px;background:#1d6b35;color:#fff;border:none;padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer;">View Listing</button>
      </div>
    `)
    return marker
  })

  if (markers.length === 1) {
    mapInstance.setView([validListings[0].lat, validListings[0].lng], 13)
  } else {
    const group = L.featureGroup(markers)
    mapInstance.fitBounds(group.getBounds().pad(0.2))
  }
}