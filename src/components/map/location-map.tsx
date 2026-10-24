import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildMapHtml, DEFAULT_CENTER, MAP_BASE_URL, parseMapMessage } from './map-html';
import { MapFrame, type LocationMapProps, type MapStatus } from './map-frame';

export type { LocationMapProps } from './map-frame';

/** Interactive OpenStreetMap map (Leaflet in a WebView) for iOS and Android. */
export function LocationMap({
  coords,
  onPick,
  interactive = true,
  height = 200,
  onTouchActiveChange,
  accessibilityLabel,
  accessibilityHint,
}: LocationMapProps) {
  const web = useRef<WebView>(null);
  const ready = useRef(false);
  /** Last point the user picked on the map: echoing it back would re-center and re-zoom the map. */
  const lastPick = useRef<string | null>(null);
  const [status, setStatus] = useState<MapStatus>('loading');
  // The page is built once; later pin changes go through injectJavaScript so the map keeps its state.
  const [html] = useState(() =>
    buildMapHtml({
      ...(coords ?? DEFAULT_CENTER),
      zoom: coords ? 16 : 12,
      pin: !!coords,
      interactive,
    }),
  );

  const pushPin = useCallback((c: LocationMapProps['coords']) => {
    if (!web.current || !ready.current) return;
    web.current.injectJavaScript(
      c
        ? `window.cityMap && window.cityMap.setPin(${Number(c.latitude)}, ${Number(c.longitude)}); true;`
        : 'window.cityMap && window.cityMap.clearPin(); true;',
    );
  }, []);

  useEffect(() => {
    if (coords && lastPick.current === `${coords.latitude},${coords.longitude}`) return;
    pushPin(coords);
  }, [coords, pushPin]);

  const onMessage = (e: WebViewMessageEvent) => {
    const msg = parseMapMessage(e.nativeEvent.data);
    if (!msg) return;
    if (msg.type === 'ready') {
      ready.current = true;
      setStatus('ready');
      pushPin(coords);
    } else if (msg.type === 'pick') {
      lastPick.current = `${msg.lat},${msg.lng}`;
      onPick?.({ latitude: msg.lat, longitude: msg.lng });
    } else if (msg.type === 'error') {
      setStatus(msg.reason === 'tiles' ? 'tiles-error' : 'error');
    }
  };

  return (
    <MapFrame
      status={status}
      height={height}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onTouchActiveChange={interactive ? onTouchActiveChange : undefined}>
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={{ html, baseUrl: MAP_BASE_URL }}
        onMessage={onMessage}
        onError={() => setStatus('error')}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        nestedScrollEnabled
        overScrollMode="never"
        setSupportMultipleWindows={false}
        // Links inside the map (OSM attribution) open in the browser instead of replacing the map.
        onShouldStartLoadWithRequest={(req) => {
          const internal = req.url.startsWith(MAP_BASE_URL) || req.url.startsWith('about:') || req.url.startsWith('data:');
          if (!internal && req.isTopFrame !== false) {
            Linking.openURL(req.url).catch(() => {});
            return false;
          }
          return true;
        }}
        style={{ backgroundColor: 'transparent' }}
      />
    </MapFrame>
  );
}
