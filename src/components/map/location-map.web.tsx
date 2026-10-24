import { useCallback, useEffect, useRef, useState } from 'react';

import { buildMapHtml, DEFAULT_CENTER, parseMapMessage } from './map-html';
import { MapFrame, type LocationMapProps, type MapStatus } from './map-frame';

export type { LocationMapProps } from './map-frame';

/**
 * Web version of the map: react-native-webview does not support web, so the same Leaflet
 * page is rendered in an <iframe srcDoc> and talks to the app with window.postMessage.
 */
export function LocationMap({
  coords,
  onPick,
  interactive = true,
  height = 200,
  onTouchActiveChange,
  accessibilityLabel,
  accessibilityHint,
}: LocationMapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const lastPick = useRef<string | null>(null);
  const coordsRef = useRef(coords);
  const onPickRef = useRef(onPick);
  const [status, setStatus] = useState<MapStatus>('loading');
  const [html] = useState(() =>
    buildMapHtml({
      ...(coords ?? DEFAULT_CENTER),
      zoom: coords ? 16 : 12,
      pin: !!coords,
      interactive,
    }),
  );

  useEffect(() => {
    coordsRef.current = coords;
    onPickRef.current = onPick;
  });

  const pushPin = useCallback((c: LocationMapProps['coords']) => {
    const win = frame.current?.contentWindow;
    if (!win || !ready.current) return;
    win.postMessage(JSON.stringify(c ? { cmd: 'setPin', lat: c.latitude, lng: c.longitude } : { cmd: 'clearPin' }), '*');
  }, []);

  useEffect(() => {
    if (coords && lastPick.current === `${coords.latitude},${coords.longitude}`) return;
    pushPin(coords);
  }, [coords, pushPin]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const msg = parseMapMessage(e.data);
      if (!msg) return;
      if (msg.type === 'ready') {
        ready.current = true;
        setStatus('ready');
        pushPin(coordsRef.current);
      } else if (msg.type === 'pick') {
        lastPick.current = `${msg.lat},${msg.lng}`;
        onPickRef.current?.({ latitude: msg.lat, longitude: msg.lng });
      } else if (msg.type === 'error') {
        setStatus(msg.reason === 'tiles' ? 'tiles-error' : 'error');
      }
    };
    window.addEventListener('message', onMessage);
    // The page may have announced "ready" before this listener existed: ask again.
    frame.current?.contentWindow?.postMessage(JSON.stringify({ cmd: 'ping' }), '*');
    return () => window.removeEventListener('message', onMessage);
  }, [pushPin]);

  return (
    <MapFrame
      status={status}
      height={height}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onTouchActiveChange={interactive ? onTouchActiveChange : undefined}>
      <iframe
        ref={frame}
        title={accessibilityHint ? `${accessibilityLabel}. ${accessibilityHint}` : accessibilityLabel}
        srcDoc={html}
        onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ cmd: 'ping' }), '*')}
        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </MapFrame>
  );
}
