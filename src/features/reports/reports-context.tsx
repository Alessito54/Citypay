import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';

import type { DataSource } from '@/lib/data-source';
import { departmentLabel, resolveDepartmentForReport } from '@/lib/orizaba';
import { useSessionData } from '@/lib/use-session-data';
import { subscribeRealtimeEvents } from '@/services/realtime-service';
import { reportsService } from '@/services/reports-service';
import type { NewReportInput, Report, ReportEstado } from '@/types';

import { useAuth } from '../auth/auth-context';

export interface LiveReportAlert {
  id: string;
  text: string;
  reportId: string;
  at: number;
}

interface ReportsValue {
  reports: Report[];
  source: DataSource;
  sourceReason?: string;
  loading: boolean;
  /** Indica si el canal en tiempo real (SSE / sincronización activa) está monitoreando cambios. */
  liveConnected: boolean;
  /** Último evento recibido en tiempo real desde otro dispositivo. */
  liveAlert: LiveReportAlert | null;
  dismissLiveAlert: () => void;
  refreshReports: () => Promise<void>;
  submitReport: (input: NewReportInput) => Promise<Report>;
  updateReportStatus: (
    id: string,
    payload: { status: ReportEstado; notes?: string; department?: string },
  ) => Promise<Report>;
}

const ReportsContext = createContext<ReportsValue | null>(null);
const EMPTY: Report[] = [];
const LIVE_POLL_MS = 4_000;

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { session, staff } = useAuth();
  const onlyMine = Boolean(session && !staff);
  const loadFn = useCallback(() => reportsService.list(onlyMine), [onlyMine]);
  const sessionKey = session ? `${session.uid}:${staff ? 'staff' : 'citizen'}` : null;

  const data = useSessionData(sessionKey, loadFn, EMPTY);
  const { update } = data;

  const [sseConnected, setSseConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState<LiveReportAlert | null>(null);
  const knownMapRef = useRef<Map<string, ReportEstado>>(new Map());
  const initializedForKeyRef = useRef<string | null>(null);

  const dismissLiveAlert = useCallback(() => setLiveAlert(null), []);

  const triggerLiveBanner = useCallback((text: string, reportId: string) => {
    setLiveAlert({ id: `${reportId}-${Date.now()}`, text, reportId, at: Date.now() });
    AccessibilityInfo.announceForAccessibility(text);
  }, []);

  // Mantener registro de los IDs y estados conocidos tras la carga inicial
  useEffect(() => {
    if (!sessionKey || data.loading) return;
    if (initializedForKeyRef.current !== sessionKey) {
      const nextMap = new Map<string, ReportEstado>();
      for (const r of data.items) nextMap.set(r.id, r.estado);
      knownMapRef.current = nextMap;
      initializedForKeyRef.current = sessionKey;
    }
  }, [sessionKey, data.loading, data.items]);

  // 1. Suscripción SSE instantánea (cuando EventSource está activo)
  useEffect(() => {
    if (!sessionKey) return;
    return subscribeRealtimeEvents(
      (msg) => {
        if (msg.type === 'report.created') {
          const incoming = msg.data as Report;
          if (!incoming?.id) return;
          const deptSlug = incoming.department || resolveDepartmentForReport(incoming.categoria, incoming.title);
          const enriched: Report = {
            ...incoming,
            department: deptSlug,
            departamentoNombre: incoming.departamentoNombre || departmentLabel(deptSlug),
          };
          const alreadyKnown = knownMapRef.current.has(enriched.id);
          knownMapRef.current.set(enriched.id, enriched.estado);
          update((prev) => (prev.some((x) => x.id === enriched.id) ? prev : [enriched, ...prev]));
          if (!alreadyKnown && staff) {
            triggerLiveBanner(
              `Nuevo reporte en tiempo real: ${enriched.title} (${departmentLabel(deptSlug)})`,
              enriched.id,
            );
          }
        } else if (msg.type === 'report.updated') {
          const incoming = msg.data as Report;
          if (!incoming?.id) return;
          const prevStatus = knownMapRef.current.get(incoming.id);
          knownMapRef.current.set(incoming.id, incoming.estado);
          update((prev) => prev.map((x) => (x.id === incoming.id ? { ...x, ...incoming } : x)));
          if (prevStatus && prevStatus !== incoming.estado) {
            triggerLiveBanner(`Actualización en tiempo real: ${incoming.title} → ${incoming.estado}`, incoming.id);
          }
        }
      },
      setSseConnected,
    );
  }, [sessionKey, staff, update, triggerLiveBanner]);

  // 2. Sincronización viva cada 4 s (garantiza tiempo real en móvil Expo Go, redes celulares y Render)
  useEffect(() => {
    if (!sessionKey) return;
    let cancelled = false;
    let busy = false;

    const tick = async () => {
      if (cancelled || busy) return;
      if (Platform.OS === 'web' && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      if (Platform.OS !== 'web' && AppState.currentState !== 'active') {
        return;
      }
      busy = true;
      try {
        const res = await reportsService.list(onlyMine);
        if (cancelled || res.source !== 'api') return;

        const prevKnown = knownMapRef.current;
        const wasInitialized = initializedForKeyRef.current === sessionKey;

        let newestAdded: Report | null = null;
        let statusChanged: Report | null = null;
        let hasChanges = res.items.length !== data.items.length;

        for (const r of res.items) {
          const oldStatus = prevKnown.get(r.id);
          if (!oldStatus) {
            hasChanges = true;
            if (!newestAdded) newestAdded = r;
          } else if (oldStatus !== r.estado) {
            hasChanges = true;
            if (!statusChanged) statusChanged = r;
          }
        }

        const nextKnown = new Map<string, ReportEstado>();
        for (const r of res.items) nextKnown.set(r.id, r.estado);
        knownMapRef.current = nextKnown;
        initializedForKeyRef.current = sessionKey;

        if (hasChanges || data.source === 'demo') {
          update(() => res.items, 'api');
          if (wasInitialized && hasChanges) {
            if (newestAdded && staff) {
              triggerLiveBanner(
                `Nuevo reporte en tiempo real: ${newestAdded.title} — ${departmentLabel(newestAdded.department)}`,
                newestAdded.id,
              );
            } else if (statusChanged) {
              triggerLiveBanner(
                `Estado actualizado en tiempo real: ${statusChanged.title} → ${statusChanged.estado}`,
                statusChanged.id,
              );
            }
          }
        }
      } catch {
        // Silencioso para no interrumpir la sesión activa
      } finally {
        busy = false;
      }
    };

    const intervalId = setInterval(tick, LIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [sessionKey, onlyMine, staff, data.items.length, data.source, update, triggerLiveBanner]);

  // Limpiar banner automático tras 9 segundos
  useEffect(() => {
    if (!liveAlert) return;
    const t = setTimeout(() => setLiveAlert(null), 9_000);
    return () => clearTimeout(t);
  }, [liveAlert]);

  const submitReport = useCallback(
    async (input: NewReportInput) => {
      const created = await reportsService.submit(input);
      knownMapRef.current.set(created.id, created.estado);
      update((prev) => (prev.some((x) => x.id === created.id) ? prev : [created, ...prev]));
      return created;
    },
    [update],
  );

  const updateReportStatus = useCallback(
    async (id: string, payload: { status: ReportEstado; notes?: string; department?: string }) => {
      const updated = await reportsService.updateStatus(id, payload);
      knownMapRef.current.set(updated.id, updated.estado);
      update((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      return updated;
    },
    [update],
  );

  const value = useMemo(
    () => ({
      reports: data.items,
      source: data.source,
      sourceReason: data.reason,
      loading: data.loading,
      liveConnected: Boolean(sessionKey) && (sseConnected || data.source === 'api'),
      liveAlert,
      dismissLiveAlert,
      refreshReports: data.refresh,
      submitReport,
      updateReportStatus,
    }),
    [
      data.items,
      data.source,
      data.reason,
      data.loading,
      data.refresh,
      sessionKey,
      sseConnected,
      liveAlert,
      dismissLiveAlert,
      submitReport,
      updateReportStatus,
    ],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used inside ReportsProvider');
  return ctx;
}
