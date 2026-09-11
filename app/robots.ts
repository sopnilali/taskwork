import type { MetadataRoute } from "next";
import { getSeoSettings, DEFAULT_SEO } from "@/lib/seo";
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSeoSettings().catch(() => DEFAULT_SEO);
  const base = seo.site_url;
  const allow = seo.robots_index;
  return {
    rules: [
      { userAgent: "*", allow: allow ? "/" : undefined, disallow: allow ? ["/api/", "/admin"] : "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
