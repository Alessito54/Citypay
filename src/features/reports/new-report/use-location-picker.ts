import * as Location from 'expo-location';
import { useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import type { MessageTone } from '@/components/ui';
import { notifyUser } from '@/lib/alerts';
import { fmtCoords, geocoding, type Coords } from '@/services/geocoding';

export type MapNote = { text: string; tone: MessageTone } | null;

/**
 * Address text ⇄ map pin ⇄ GPS. Owns the location state of the form so the screen only
 * renders it. Uses OpenStreetMap's Nominatim and falls back to the OS geocoder on mobile.
 */
export function useLocationPicker(onAddressResolved: () => void) {
  const [addr, setAddr] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [busy, setBusy] = useState<'search' | 'reverse' | 'gps' | null>(null);
  const [note, setNote] = useState<MapNote>(null);
  /** Address the current pin corresponds to; "Buscar en el mapa" is highlighted only when the text changed. */
  const [resolvedAddr, setResolvedAddr] = useState('');

  const labelFor = async (c: Coords) => {
    let label = (await geocoding.reverse(c)).label;
    if (label === fmtCoords(c) && Platform.OS !== 'web') {
      try {
        const [a] = await Location.reverseGeocodeAsync(c);
        const parts = [a?.street && `${a.street}${a.streetNumber ? ` #${a.streetNumber}` : ''}`, a?.city, a?.region].filter(Boolean);
        if (parts.length) label = parts.join(', ');
      } catch {
        /* keep coordinates */
      }
    }
    return label;
  };

  const fillFrom = async (c: Coords, origin: 'map' | 'gps') => {
    setBusy('reverse');
    const label = await labelFor(c);
    setBusy(null);
    setAddr(label);
    setResolvedAddr(label);
    onAddressResolved();
    setNote({
      tone: 'success',
      text:
        origin === 'map'
          ? 'Marcamos el lugar en el mapa y completamos la dirección. Revísala y corrígela si hace falta.'
          : 'Usamos tu ubicación actual. Puedes mover el marcador si el lugar exacto es otro.',
    });
    AccessibilityInfo.announceForAccessibility(`Ubicación: ${label}`);
  };

  const pickOnMap = (c: Coords) => {
    setCoords(c);
    fillFrom(c, 'map');
  };

  const useMyLocation = async () => {
    setBusy('gps');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        notifyUser('Permiso requerido', 'Concede acceso a la ubicación para usar esta opción, o escribe la dirección.');
        setBusy(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      await fillFrom(c, 'gps');
    } catch {
      setBusy(null);
      notifyUser('Ubicación', 'No se pudo obtener tu ubicación actual. Escribe la dirección o toca el mapa.');
    }
  };

  const canSearch = addr.trim().length >= 4 && !busy;

  /** Address text → pin. The typed text is kept as written by the user. */
  const searchOnMap = async () => {
    if (!canSearch) return;
    setBusy('search');
    setNote(null);
    try {
      const r = await geocoding.search(addr.trim(), coords);
      if (r) {
        setCoords({ latitude: r.latitude, longitude: r.longitude });
        setResolvedAddr(addr);
        setNote({ tone: 'success', text: `Encontrado: ${r.label}. Si no es el lugar exacto, toca el mapa o arrastra el marcador.` });
        AccessibilityInfo.announceForAccessibility('Dirección encontrada en el mapa');
      } else {
        setNote({ tone: 'info', text: 'No encontramos esa dirección en el mapa. Agrega la colonia o la ciudad, o toca el mapa para marcar el lugar.' });
      }
    } catch {
      setNote({ tone: 'error', text: 'No se pudo buscar en el mapa. Revisa tu conexión; puedes enviar el reporte solo con la dirección.' });
    } finally {
      setBusy(null);
    }
  };

  const clear = () => {
    setAddr('');
    setResolvedAddr('');
    setCoords(null);
    setNote(null);
  };

  return { addr, setAddr, coords, busy, note, canSearch, textChanged: addr !== resolvedAddr, pickOnMap, useMyLocation, searchOnMap, clear };
}

export type LocationPicker = ReturnType<typeof useLocationPicker>;
