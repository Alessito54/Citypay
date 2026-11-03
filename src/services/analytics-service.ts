import type { AnalyticsOverview, Informe, InformeGroupBy, InformeType } from '@/types';

import { apiClient } from './api-client';

export interface InformeQuery {
  type: InformeType;
  groupBy?: InformeGroupBy;
  /** ISO dates (YYYY-MM-DD). */
  from?: string | null;
  to?: string | null;
  /** Department slug, or 'all' / undefined for the whole municipality. */
  department?: string | null;
}

function toQuery(params: Record<string, string | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** Centro de Informes: aggregated figures produced by the backend. */
export const analyticsService = {
  async overview(from?: string | null, to?: string | null): Promise<AnalyticsOverview> {
    return apiClient<AnalyticsOverview>(`/analytics/overview${toQuery({ from, to })}`);
  },

  async informe(query: InformeQuery): Promise<Informe> {
    return apiClient<Informe>(
      `/analytics/informe${toQuery({
        type: query.type,
        groupBy: query.groupBy,
        from: query.from,
        to: query.to,
        department: query.department && query.department !== 'all' ? query.department : undefined,
      })}`,
    );
  },

  /** Departments the signed-in account may report on. */
  async scope(): Promise<{ global: boolean; items: { slug: string; name: string }[] }> {
    try {
      const res = await apiClient<{ global: boolean; items: { slug: string; name: string }[] }>(
        '/analytics/scope',
      );
      return { global: !!res?.global, items: res?.items ?? [] };
    } catch {
      return { global: false, items: [] };
    }
  },
};
