/**
 * Demo mode's `mockDb` (src/lib/data/mock-store.ts) is a JSON-file-backed
 * store and is `server-only`. It's imported exclusively by the `/api/demo/*`
 * route handlers — never from this file — so that files like leads.ts /
 * quotes.ts / activities.ts (which client components also import) stay
 * bundleable for the browser. All demo-mode reads/writes, from both the
 * browser and Server Components, go over HTTP to those routes instead.
 */

function baseUrl() {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_SITE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
}

export async function demoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, { cache: "no-store", ...init });
  return res.json() as Promise<T>;
}

export async function demoFetchOrNull<T>(path: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(`${baseUrl()}${path}`, { cache: "no-store", ...init });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}
