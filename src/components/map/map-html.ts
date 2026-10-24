/**
 * Self-contained Leaflet page rendered inside a WebView (iOS/Android) or an <iframe> (web).
 *
 * Open-source stack, no API key:
 *  - Leaflet 1.9.4 (BSD-2) from unpkg, pinned with Subresource Integrity hashes;
 *  - OpenStreetMap raster tiles (ODbL data, attribution shown on the map).
 *
 * Messages page → app: { source: 'citypay-map', type: 'ready' | 'pick' | 'error', lat?, lng? }
 * Commands app → page: window.cityMap.setPin(lat, lng, zoom?) / clearPin(), or postMessage({ cmd }).
 * `{ cmd: 'ping' }` makes the page repeat 'ready' (handshake for hosts that subscribe late).
 */

export const MAP_SOURCE = 'citypay-map';

/** Fallback center when there is no pin yet (Zócalo, Ciudad de México). Change it to the municipality. */
export const DEFAULT_CENTER = { latitude: 19.4326, longitude: -99.1332 };

/** Origin the page runs on inside the WebView, so OSM tile requests carry a Referer identifying the app. */
export const MAP_BASE_URL = 'https://github.com/Alessito54/Citypay';

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS_SRI = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
const LEAFLET_CSS_SRI = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export interface MapConfig {
  latitude: number;
  longitude: number;
  zoom: number;
  /** Show the pin at latitude/longitude on load. */
  pin: boolean;
  /** Allow tapping / dragging to move the pin and panning the map. */
  interactive: boolean;
}

export type MapMessage =
  | { source: typeof MAP_SOURCE; type: 'ready' }
  | { source: typeof MAP_SOURCE; type: 'pick'; lat: number; lng: number }
  | { source: typeof MAP_SOURCE; type: 'error'; reason: 'leaflet' | 'tiles' };

export function parseMapMessage(data: unknown): MapMessage | null {
  try {
    const msg = typeof data === 'string' ? JSON.parse(data) : data;
    return msg && typeof msg === 'object' && (msg as MapMessage).source === MAP_SOURCE ? (msg as MapMessage) : null;
  } catch {
    return null;
  }
}

export function buildMapHtml(config: MapConfig): string {
  // JSON is embedded in a <script>; escaping "<" prevents a "</script>" break-out.
  const cfg = JSON.stringify({ ...config, tiles: TILE_URL, source: MAP_SOURCE }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css" integrity="${LEAFLET_CSS_SRI}" crossorigin="">
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #EEF4FF; }
  body { font-family: -apple-system, Roboto, "Segoe UI", sans-serif; -webkit-tap-highlight-color: transparent; }
  /* Zoom buttons at 44px: the Leaflet default (30px) is below the minimum touch target. */
  .leaflet-control-zoom a { width: 44px !important; height: 44px !important; line-height: 44px !important; font-size: 22px !important; color: #1B3FA0 !important; }
  .leaflet-control-attribution { font-size: 11px; }
  .cp-pin { filter: drop-shadow(0 2px 2px rgba(0,0,0,.35)); }
  #msg { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; text-align: center; padding: 16px; color: #526073; font-size: 14px; background: #EEF4FF; }
</style>
</head>
<body>
<div id="map"></div>
<div id="msg"></div>
<script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js" integrity="${LEAFLET_JS_SRI}" crossorigin=""></script>
<script>
(function () {
  var cfg = ${cfg};
  function send(m) {
    m.source = cfg.source;
    var s = JSON.stringify(m);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent && window.parent !== window) window.parent.postMessage(s, '*');
  }
  function fail(reason, text) {
    var el = document.getElementById('msg');
    el.textContent = text; el.style.display = 'flex';
    send({ type: 'error', reason: reason });
  }
  if (!window.L) { fail('leaflet', 'No se pudo cargar el mapa. Revisa tu conexión.'); return; }

  var map = L.map('map', {
    zoomControl: cfg.interactive,
    dragging: cfg.interactive,
    touchZoom: cfg.interactive,
    doubleClickZoom: cfg.interactive,
    scrollWheelZoom: false,
    boxZoom: false,
    keyboard: cfg.interactive
  }).setView([cfg.latitude, cfg.longitude], cfg.zoom);

  var tileErrors = 0, tileLoaded = false;
  L.tileLayer(cfg.tiles, {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).on('tileload', function () { tileLoaded = true; })
    .on('tileerror', function () {
      tileErrors += 1;
      if (!tileLoaded && tileErrors === 4) send({ type: 'error', reason: 'tiles' });
    })
    .addTo(map);

  var icon = L.divIcon({
    className: 'cp-pin',
    html: '<svg width="34" height="44" viewBox="0 0 24 31" xmlns="http://www.w3.org/2000/svg"><path d="M12 0a11 11 0 0 0-11 11c0 8.3 11 20 11 20s11-11.7 11-20A11 11 0 0 0 12 0z" fill="#1B3FA0"/><circle cx="12" cy="11" r="4.2" fill="#fff"/></svg>',
    iconSize: [34, 44],
    iconAnchor: [17, 43]
  });

  var marker = null;
  function place(lat, lng) {
    if (marker) { marker.setLatLng([lat, lng]); return; }
    marker = L.marker([lat, lng], { icon: icon, draggable: cfg.interactive, keyboard: false }).addTo(map);
    marker.on('dragend', function () {
      var p = marker.getLatLng();
      send({ type: 'pick', lat: p.lat, lng: p.lng });
    });
  }
  if (cfg.pin) place(cfg.latitude, cfg.longitude);

  if (cfg.interactive) {
    map.on('click', function (e) {
      place(e.latlng.lat, e.latlng.lng);
      send({ type: 'pick', lat: e.latlng.lat, lng: e.latlng.lng });
    });
  }

  window.cityMap = {
    setPin: function (lat, lng, zoom) {
      place(lat, lng);
      map.setView([lat, lng], zoom || Math.max(map.getZoom(), 16));
    },
    clearPin: function () { if (marker) { map.removeLayer(marker); marker = null; } }
  };
  window.addEventListener('message', function (e) {
    try {
      var d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (!d || !d.cmd) return;
      if (d.cmd === 'setPin') window.cityMap.setPin(d.lat, d.lng, d.zoom);
      if (d.cmd === 'clearPin') window.cityMap.clearPin();
      // Handshake: the host may start listening after the first "ready" was sent.
      if (d.cmd === 'ping') send({ type: 'ready' });
    } catch (_) {}
  });
  send({ type: 'ready' });
})();
</script>
</body>
</html>`;
}
