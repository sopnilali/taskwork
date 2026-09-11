import type { MetadataRoute } from "next";
import { getSeoSettings, DEFAULT_SEO, getAllPageSeo } from "@/lib/seo";
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, pages] = await Promise.all([getSeoSettings().catch(()=> DEFAULT_SEO), getAllPageSeo().catch(()=> [])]);
  const base = seo.site_url;
  const now = new Date();
  if (pages.length) {
    const pri: Record<string, number> = { '/':1, '/dashboard':0.8, '/task-work':0.9, '/task-list':0.7, '/payout':0.5, '/auth':0.6, '/admin':0.3, '/blog':0.7, '/about':0.5, '/pricing':0.6, '/contact':0.5 };
    const baseRoutes = pages.filter(p=> p.robots_index).map(p=> ({ url: `${base}${p.route}`, lastModified: now, changeFrequency: 'weekly' as const, priority: pri[p.route] ?? 0.5 }));
    try { const { sql } = await import('@/lib/db'); const posts = await sql`SELECT slug, updated_at FROM blog_posts WHERE published=true`; for (const po of posts as any[]) baseRoutes.push({ url: `${base}/blog/${po.slug}`, lastModified: po.updated_at ? new Date(po.updated_at) : now, changeFrequency: 'weekly' as const, priority: 0.6 }); } catch {}
    return baseRoutes;
  }
  const routes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/auth`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/task-work`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/task-list`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/payout`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];
  return routes;
}
