import { Platform } from 'react-native';

import { BASE_URL, getAuthToken } from './api-client';

export interface RealtimeMessage<T = unknown> {
  type: 'report.created' | 'report.updated' | 'payment.created' | 'payment.reconciled' | 'heartbeat';
  timestamp: string;
  data: T;
}

/**
 * Suscribe al cliente Web a eventos SSE (`/reports/stream`) cuando `EventSource` está disponible.
 * En iOS/Android o cuando el servidor en la nube aún no expone SSE, `useRealtimeSync` complementa
 * con sincronización silenciosa cada pocos segundos para garantizar actualización en tiempo real.
 */
export function subscribeRealtimeEvents(
  onEvent: (msg: RealtimeMessage) => void,
  onConnectionChange?: (connected: boolean) => void,
): () => void {
  if (Platform.OS !== 'web' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let es: EventSource | null = null;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = async () => {
    if (closed) return;
    const token = await getAuthToken();
    if (!token || closed) return;

    const url = `${BASE_URL}/reports/stream?token=${encodeURIComponent(token)}`;
    es = new EventSource(url);

    const handlePayload = (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data) as RealtimeMessage;
        if (parsed && parsed.type && parsed.type !== 'heartbeat') {
          onEvent(parsed);
        }
      } catch {
        // Ignora tramas no JSON
      }
    };

    es.onopen = () => onConnectionChange?.(true);
    es.onmessage = handlePayload;
    es.addEventListener('report.created', handlePayload as EventListener);
    es.addEventListener('report.updated', handlePayload as EventListener);
    es.addEventListener('payment.created', handlePayload as EventListener);
    es.addEventListener('payment.reconciled', handlePayload as EventListener);

    es.onerror = () => {
      onConnectionChange?.(false);
      es?.close();
      es = null;
      if (!closed) {
        retryTimer = setTimeout(connect, 8_000);
      }
    };
  };

  void connect();

  return () => {
    closed = true;
    onConnectionChange?.(false);
    if (retryTimer) clearTimeout(retryTimer);
    es?.close();
  };
}
