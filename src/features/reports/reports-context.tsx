import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { reportsService } from '@/services/reports-service';
import type { NewReportInput, Report } from '@/types';

interface ReportsValue {
  reports: Report[];
  loading: boolean;
  refreshReports: () => Promise<void>;
  submitReport: (input: NewReportInput) => Promise<Report>;
}

const ReportsContext = createContext<ReportsValue | null>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshReports = useCallback(async () => {
    setLoading(true);
    try {
      const list = await reportsService.list();
      setReports(list);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount-time fetch: the provider owns this data, so the request belongs here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshReports();
  }, [refreshReports]);

  const submitReport = useCallback(async (input: NewReportInput) => {
    const created = await reportsService.submit(input);
    setReports((prev) => [created, ...prev]);
    return created;
  }, []);

  const value = useMemo(
    () => ({ reports, loading, refreshReports, submitReport }),
    [reports, loading, refreshReports, submitReport],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used inside ReportsProvider');
  return ctx;
}
