/**
 * Best-effort in-memory rate limiter. Not distributed — resets on cold
 * start and doesn't coordinate across concurrent serverless instances — but
 * it needs no external infrastructure and still blunts casual abuse and
 * brute-force attempts against secret-gated endpoints. Swap for a
 * KV/Redis-backed limiter if this needs to hold up under real attack volume.
 */
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > limit;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
