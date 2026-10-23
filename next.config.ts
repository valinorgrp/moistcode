import type { NextConfig } from "next";

/**
 * Security headers on every response.
 *
 * - HSTS: Vercel already redirects http -> https; this tells browsers to
 *   never try plain http again for this domain (2 years, subdomains too).
 * - frame-ancestors / X-Frame-Options: nobody can embed the CRM in an iframe
 *   (blocks clickjacking).
 * - Permissions-Policy: the microphone is allowed for this site only (voice
 *   logging in the quick chat); camera and location are off.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The app has no <Image> components, so the image optimizer endpoint is
  // turned off rather than left exposed (it's been the source of several
  // Next.js security advisories).
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
