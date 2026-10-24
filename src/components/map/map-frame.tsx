import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { C, FONT } from '@/constants/colors';
import type { Coords } from '@/services/geocoding';

export interface LocationMapProps {
  /** Pin position; null shows the default center without a pin. */
  coords: Coords | null;
  /** User tapped the map or dragged the pin. Not called for programmatic changes. */
  onPick?: (c: Coords) => void;
  interactive?: boolean;
  height?: number;
  /** true while a finger is on the map, so the parent ScrollView can stop stealing the pan gesture. */
  onTouchActiveChange?: (active: boolean) => void;
  /** What the map shows, read by TalkBack/VoiceOver instead of the (visual-only) map content. */
  accessibilityLabel: string;
  accessibilityHint?: string;
}

export type MapStatus = 'loading' | 'ready' | 'error' | 'tiles-error';

/**
 * Common chrome for both map engines. The map itself is visual only, so it is exposed to
 * screen readers as one element with a description; the address field and the
 * "Usar mi ubicación" button are the accessible way to set the location.
 */
export function MapFrame({
  status,
  height,
  accessibilityLabel,
  accessibilityHint,
  onTouchActiveChange,
  children,
}: {
  status: MapStatus;
  height: number;
  accessibilityLabel: string;
  accessibilityHint?: string;
  onTouchActiveChange?: (active: boolean) => void;
  children: React.ReactNode;
}) {
  // On web the <iframe> keeps its own title and keyboard controls (hiding focusable content
  // inside aria-hidden fails axe "frame-focusable-content"); on iOS/Android it is one described element.
  const native = Platform.OS !== 'web';
  return (
    <View
      style={[s.frame, { height }]}
      accessible={native}
      accessibilityRole={native ? 'image' : undefined}
      accessibilityLabel={native ? accessibilityLabel : undefined}
      accessibilityHint={native ? accessibilityHint : undefined}
      onTouchStart={() => onTouchActiveChange?.(true)}
      onTouchEnd={() => onTouchActiveChange?.(false)}
      onTouchCancel={() => onTouchActiveChange?.(false)}>
      <View
        style={StyleSheet.absoluteFill}
        importantForAccessibility={native ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={native}>
        {children}
      </View>
      {status === 'loading' ? (
        <View style={s.overlay} pointerEvents="none">
          <ActivityIndicator color={C.blue} />
          <Text style={s.overlayText}>Cargando mapa…</Text>
        </View>
      ) : null}
      {status === 'error' ? (
        <View style={s.overlay} pointerEvents="none">
          <Text style={s.overlayText}>No se pudo cargar el mapa. Revisa tu conexión; puedes escribir la dirección.</Text>
        </View>
      ) : null}
      {status === 'tiles-error' ? (
        <View style={s.banner} pointerEvents="none">
          <Text style={s.bannerText}>No se pudieron cargar las calles del mapa.</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  frame: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.inputBorder, backgroundColor: C.blueSoft },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: C.blueSoft },
  overlayText: { fontFamily: FONT.sansSemi, fontSize: 13.5, color: C.text2, textAlign: 'center' },
  banner: { position: 'absolute', left: 8, right: 8, top: 8, padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.95)' },
  bannerText: { fontFamily: FONT.sansSemi, fontSize: 12.5, color: C.danger, textAlign: 'center' },
});
