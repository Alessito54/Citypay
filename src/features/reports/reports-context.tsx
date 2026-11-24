import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import type { DataSource } from '@/lib/data-source';
import { useSessionData } from '@/lib/use-session-data';
import { reportsService } from '@/services/reports-service';
import type { NewReportInput, Report } from '@/types';

import { useAuth } from '../auth/auth-context';

interface ReportsValue {
  reports: Report[];
  source: DataSource;
  loading: boolean;
  refreshReports: () => Promise<void>;
  submitReport: (input: NewReportInput) => Promise<Report>;
}

const ReportsContext = createContext<ReportsValue | null>(null);
const EMPTY: Report[] = [];

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const data = useSessionData(session?.uid ?? null, reportsService.list, EMPTY);
  const { update } = data;

  const submitReport = useCallback(
    async (input: NewReportInput) => {
      const created = await reportsService.submit(input);
      update((prev) => [created, ...prev]);
      return created;
    },
    [update],
  );

  const value = useMemo(
    () => ({ reports: data.items, source: data.source, loading: data.loading, refreshReports: data.refresh, submitReport }),
    [data.items, data.source, data.loading, data.refresh, submitReport],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used inside ReportsProvider');
  return ctx;
}
