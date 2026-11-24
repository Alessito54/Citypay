/**
 * Where the data on screen comes from. Screens show a notice whenever it is not the API,
 * so demo records are never mistaken for real payments or reports.
 */
export type DataSource = 'api' | 'demo';

export interface Loaded<T> {
  items: T;
  source: DataSource;
  /** Why the API could not be used, when source is 'demo'. */
  reason?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Backend ids are UUIDs; demo records use short ids such as "1" or "r3". */
export const isDemoId = (id: string) => !UUID_RE.test(id);
