import { createHash } from 'node:crypto';
import { guidPattern, UserError } from './contracts.ts';

export class DataverseError extends Error {
  readonly status: number;
  constructor(status: number) { super('Dataverse operation failed.'); this.status = status; }
}

export type Entity = Record<string, unknown> & { '@odata.etag'?: string };
type Fetch = typeof fetch;

export function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('Missing server setting: ' + name);
  return value;
}

export function validGuid(value: unknown): string {
  if (typeof value !== 'string' || !guidPattern.test(value)) throw new UserError('Invalid record reference.');
  return value.toLowerCase();
}

export function stableId(...parts: string[]): string {
  const digest = createHash('sha256').update(JSON.stringify(parts)).digest('hex');
  return [digest.slice(0, 8), digest.slice(8, 12), '8' + digest.slice(13, 16), '8' + digest.slice(17, 20), digest.slice(20, 32)].join('-');
}

export function odataText(value: string): string {
  return "'" + value.replaceAll("'", "''") + "'";
}

export function entityPath(set: string, id: string): string {
  return set + '(' + validGuid(id) + ')';
}

export function query(fields: string, filter?: string, order?: string): string {
  const values = new URLSearchParams({ $select: fields });
  if (filter) values.set('$filter', filter);
  if (order) values.set('$orderby', order);
  return '?' + values.toString();
}

export function makeTokenProvider(config: { tenant: string; client: string; secret: string }, fetcher: Fetch = fetch) {
  const tenant = validGuid(config.tenant);
  const client = validGuid(config.client);
  const pending = new Map<string, Promise<{ token: string; until: number }>>();
  const cache = new Map<string, { token: string; until: number }>();
  return async function tokenFor(scope: string) {
    const existing = cache.get(scope);
    if (existing && existing.until > Date.now()) return existing.token;
    let result = pending.get(scope);
    if (!result) {
      result = (async () => {
        const response = await fetcher('https://login.microsoftonline.com/' + tenant + '/oauth2/v2.0/token', {
          method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12000),
          body: new URLSearchParams({ client_id: client, client_secret: config.secret, grant_type: 'client_credentials', scope })
        });
        if (!response.ok) throw new Error('The application identity could not authenticate.');
        const data = await response.json() as { access_token?: string; expires_in?: number };
        if (!data.access_token || typeof data.expires_in !== 'number') throw new Error('Invalid identity response.');
        const value = { token: data.access_token, until: Date.now() + Math.max(0, data.expires_in - 90) * 1000 };
        cache.set(scope, value);
        return value;
      })().finally(() => pending.delete(scope));
      pending.set(scope, result);
    }
    return (await result).token;
  };
}

export function createDataverse(origin: string, getToken: () => Promise<string>, fetcher: Fetch = fetch) {
  const base = new URL(origin);
  if (base.protocol !== 'https:' || !base.hostname.endsWith('.dynamics.com') || base.username ||
      base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('Use the bare HTTPS Dataverse environment origin.');
  }
  const apiRoot = base.origin + '/api/data/v9.2/';

  async function call(path: string, init: RequestInit = {}) {
    const url = new URL(path, apiRoot);
    if (url.origin !== base.origin || !url.href.startsWith(apiRoot) || url.hash) {
      throw new Error('Unexpected Dataverse URL.');
    }
    const headers = new Headers(init.headers);
    headers.set('Authorization', 'Bearer ' + await getToken());
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    headers.set('OData-Version', '4.0');
    headers.set('OData-MaxVersion', '4.0');
    const response = await fetcher(url, { ...init, headers, redirect: 'error', cache: 'no-store',
      signal: AbortSignal.timeout(25000) });
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new DataverseError(response.status);
    }
    return response;
  }

  async function get<T extends Entity>(path: string): Promise<T | undefined> {
    try { return await (await call(path)).json() as T; }
    catch (error) {
      if (error instanceof DataverseError && error.status === 404) return undefined;
      throw error;
    }
  }

  async function list<T extends Entity>(path: string, maxPages = 30): Promise<T[]> {
    const results: T[] = [];
    const visited = new Set<string>();
    for (let page = 0; path && page < maxPages; page++) {
      if (visited.has(path)) throw new Error('Dataverse repeated a page.');
      visited.add(path);
      const page = await call(path, { headers: { Prefer: 'odata.maxpagesize=250' } });
      const body = await page.json() as { value: T[]; '@odata.nextLink'?: string };
      if (!Array.isArray(body.value)) throw new Error('Invalid Dataverse list result.');
      results.push(...body.value);
      path = body['@odata.nextLink'] ?? '';
    }
    if (path) throw new Error('Dataverse result exceeded the page limit.');
    return results;
  }

  async function patch(path: string, values: Record<string, unknown>, condition: { create: true } | { match: string }) {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if ('create' in condition) headers.set('If-None-Match', '*');
    else headers.set('If-Match', condition.match);
    try { await call(path, { method: 'PATCH', headers, body: JSON.stringify(values) }); return true; }
    catch (error) {
      if (error instanceof DataverseError && error.status === 412) return false;
      throw error;
    }
  }

  return { call, get, list, patch };
}

export type Dataverse = ReturnType<typeof createDataverse>;

export function makeCompanyIdentity() {
  return makeTokenProvider({ tenant: required('PC_TENANT_ID'), client: required('PC_CLIENT_ID'), secret: required('PC_CLIENT_SECRET') });
}
