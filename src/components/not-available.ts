import { Alert } from 'react-native';

/** Used for mockup buttons whose feature needs a backend that does not exist yet. */
export function notAvailable(feature: string) {
  Alert.alert(feature, 'Esta función estará disponible cuando se conecte el backend de CityPay.');
}
