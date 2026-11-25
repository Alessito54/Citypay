import { useCallback, useEffect, useState } from 'react';

import type { DataSource, Loaded } from './data-source';

interface State<T> {
  /** User the data belongs to; data of a previous user is never shown. */
  owner: string | null;
  items: T;
  source: DataSource;
  reason?: string;
}

/**
 * Loads data for the signed-in user and reloads it when the user changes.
 * The previous providers fetched once at app start, before sign-in, so the API answered
 * 401 and the screens kept showing demo data for the whole session.
 */
export function useSessionData<T>(uid: string | null, load: () => Promise<Loaded<T>>, empty: T) {
  const [state, setState] = useState<State<T>>({ owner: null, items: empty, source: 'api' });

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    load().then((r) => {
      if (alive) setState({ owner: uid, items: r.items, source: r.source, reason: r.reason });
    });
    return () => {
      alive = false;
    };
  }, [uid, load]);

  const refresh = useCallback(async () => {
    if (!uid) return;
    const r = await load();
    setState({ owner: uid, items: r.items, source: r.source, reason: r.reason });
  }, [uid, load]);

  const current = uid !== null && state.owner === uid;
  const update = useCallback(
    (fn: (items: T) => T, nextSource?: DataSource) =>
      setState((s) => ({
        ...s,
        items: fn(s.items),
        ...(nextSource ? { source: nextSource, reason: nextSource === 'api' ? undefined : s.reason } : {}),
      })),
    [],
  );

  return {
    items: current ? state.items : empty,
    source: state.source,
    reason: state.reason,
    loading: uid !== null && !current,
    refresh,
    update,
  };
}
