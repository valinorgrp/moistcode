import { timingSafeEqual } from "crypto";

/**
 * Constant-time string comparison for secrets — a plain `===` short-circuits
 * on the first mismatched byte, which can leak how much of a guess is
 * correct via response timing. Length is checked first (not itself
 * sensitive for a fixed-length secret) so `timingSafeEqual` always gets
 * equal-length buffers, which it requires.
 */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
