const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:8080';

export async function proxyFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${PROXY_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  return res;
}

export async function fetchWorkspaces(clerkId: string) {
  const res = await proxyFetch(`/api/workspaces/by-user/${clerkId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.workspaces;
}

export async function fetchWorkspaceDetails(slug: string) {
  const res = await proxyFetch(`/api/workspaces/${slug}/details`);
  if (!res.ok) return null;
  return res.json();
}

export async function promoteTrial(token: string, userId: string) {
  const res = await proxyFetch(`/api/trial/${token}/promote`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Failed to promote trial');
  return res.json();
}

export async function createApiKey(slug: string, name: string) {
  const res = await proxyFetch(`/api/workspaces/${slug}/api-keys`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create API key');
  return res.json();
}

export async function revokeApiKey(slug: string, keyId: string) {
  const res = await proxyFetch(`/api/workspaces/${slug}/api-keys/${keyId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to revoke key');
  return res.json();
}

export async function fetchFleetReport(slug: string, fleetId: string) {
  const res = await proxyFetch(`/api/workspaces/${slug}/fleets/${fleetId}/report`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchAuditLog(slug: string, limit = 50, offset = 0) {
  const res = await proxyFetch(`/api/workspaces/${slug}/audit?limit=${limit}&offset=${offset}`);
  if (!res.ok) return { events: [] };
  return res.json();
}
