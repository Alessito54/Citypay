import { Platform } from 'react-native';

/**
 * Address ⇄ coordinates using Nominatim, the open-source geocoder of OpenStreetMap.
 *
 * Usage policy of the public server (https://operations.osmfoundation.org/policies/nominatim/):
 *  - at most 1 request per second → `throttle()` below;
 *  - identify the application → User-Agent on native (browsers send their own + Referer);
 *  - only on explicit user actions (tap on the map, "search", "use my location"), never per keystroke.
 * For production traffic the municipality should host its own Nominatim instance and
 * change `NOMINATIM_URL`.
 */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const APP_ID = 'CityPay/1.0 (https://github.com/Alessito54/Citypay)';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult extends Coords {
  /** Short human address: "Calle #123, Colonia, Ciudad". */
  label: string;
}

let lastRequest = 0;
async function throttle() {
  const wait = lastRequest + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();
}

async function request<T>(path: string, params: Record<string, string>): Promise<T> {
  await throttle();
  const qs = new URLSearchParams({ format: 'jsonv2', 'accept-language': 'es', ...params }).toString();
  const headers: Record<string, string> = { Accept: 'application/json' };
  // Browsers do not allow overriding User-Agent; they send Referer instead, which the policy accepts.
  if (Platform.OS !== 'web') headers['User-Agent'] = APP_ID;
  const res = await fetch(`${NOMINATIM_URL}${path}?${qs}`, { headers });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return (await res.json()) as T;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
}

interface NominatimPlace {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

/** Turns Nominatim's structured address into the "Calle #, Colonia, Ciudad" format used by the form. */
export function formatAddress(place: NominatimPlace): string {
  const a = place.address;
  if (!a) return place.display_name;
  const street = a.road ?? a.pedestrian;
  const parts = [
    street ? `${street}${a.house_number ? ` #${a.house_number}` : ''}` : undefined,
    a.neighbourhood ?? a.suburb ?? a.quarter,
    a.city ?? a.town ?? a.village ?? a.municipality,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : place.display_name;
}

export const fmtCoords = (c: Coords) => `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`;

export const geocoding = {
  /** Coordinates → address. Falls back to the raw coordinates when the lookup fails. */
  async reverse(c: Coords): Promise<GeocodeResult> {
    try {
      const place = await request<NominatimPlace & { error?: string }>('/reverse', {
        lat: String(c.latitude),
        lon: String(c.longitude),
        zoom: '18',
        addressdetails: '1',
      });
      if (place.error) throw new Error(place.error);
      return { ...c, label: formatAddress(place) };
    } catch {
      return { ...c, label: fmtCoords(c) };
    }
  },

  /** Address text → best match in Mexico, or null when nothing is found. */
  async search(query: string, near?: Coords | null): Promise<GeocodeResult | null> {
    const params: Record<string, string> = { q: query, limit: '1', countrycodes: 'mx', addressdetails: '1' };
    if (near) {
      // Prefer results around the current pin (about ±0.3°, roughly a metropolitan area).
      const d = 0.3;
      params.viewbox = [near.longitude - d, near.latitude + d, near.longitude + d, near.latitude - d].join(',');
    }
    const [place] = await request<NominatimPlace[]>('/search', params);
    if (!place) return null;
    return { latitude: Number(place.lat), longitude: Number(place.lon), label: formatAddress(place) };
  },
};
