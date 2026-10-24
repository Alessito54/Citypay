import { notify } from './confirm';

/** Used for mockup buttons whose feature needs a backend that does not exist yet. */
export function notAvailable(feature: string) {
  notify(feature, 'Esta función estará disponible cuando se conecte el backend de CityPay.');
}
