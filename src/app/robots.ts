import type { MetadataRoute } from "next";

/**
 * Pipeline is a private, sign-in-only app, so it asks search engines not to
 * crawl or list it. (Every page also carries a noindex robots meta tag.) That
 * is also why there's no sitemap: there are no public pages to list besides
 * the sign-in, privacy and terms pages.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
