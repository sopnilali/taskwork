import { sql } from '@/lib/db';

export type SeoSettings = {
  site_name: string;
  site_url: string;
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  twitter_handle: string;
  canonical_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  google_verification: string;
  bing_verification: string;
  theme_color: string;
  author: string;
  json_ld_enabled: boolean;
};

export const DEFAULT_SEO: SeoSettings = {
  site_name: 'TaskTimer',
  site_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tasktimer.example.com',
  title: 'TaskTimer — Free Online Task Timer & Productivity Tracker',
  description: 'Free online task timer to track work time, manage hourly earnings, and boost productivity. Start, pause, resume timers with daily stats and activity logs. No signup hassle.',
  keywords: 'task timer, time tracker, productivity timer, work timer, pomodoro timer, hourly rate calculator, time tracking, task management, free online timer, freelance time tracker',
  og_image: '/tasktimer-logo.svg',
  twitter_handle: '@tasktimer',
  canonical_url: '/',
  robots_index: true,
  robots_follow: true,
  google_verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  bing_verification: '',
  theme_color: '#6366f1',
  author: 'TaskTimer',
  json_ld_enabled: true,
};

export async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const rows = await sql`SELECT key, value FROM seo_settings`;
    if (!rows.length) return DEFAULT_SEO;
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      site_name: map.site_name || DEFAULT_SEO.site_name,
      site_url: map.site_url || DEFAULT_SEO.site_url,
      title: map.title || DEFAULT_SEO.title,
      description: map.description || DEFAULT_SEO.description,
      keywords: map.keywords || DEFAULT_SEO.keywords,
      og_image: map.og_image || DEFAULT_SEO.og_image,
      twitter_handle: map.twitter_handle || DEFAULT_SEO.twitter_handle,
      canonical_url: map.canonical_url || DEFAULT_SEO.canonical_url,
      robots_index: map.robots_index ? map.robots_index === 'true' : DEFAULT_SEO.robots_index,
      robots_follow: map.robots_follow ? map.robots_follow === 'true' : DEFAULT_SEO.robots_follow,
      google_verification: map.google_verification ?? DEFAULT_SEO.google_verification,
      bing_verification: map.bing_verification ?? DEFAULT_SEO.bing_verification,
      theme_color: map.theme_color || DEFAULT_SEO.theme_color,
      author: map.author || DEFAULT_SEO.author,
      json_ld_enabled: map.json_ld_enabled ? map.json_ld_enabled === 'true' : DEFAULT_SEO.json_ld_enabled,
    };
  } catch {
    return DEFAULT_SEO;
  }
}

export async function saveSeoSettings(data: Partial<SeoSettings>) {
  for (const [k, v] of Object.entries(data)) {
    const val = String(v);
    await sql`INSERT INTO seo_settings (key, value) VALUES (${k}, ${val}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  }
}

export type PageSeo = { route: string; title: string; description: string; keywords: string; og_image: string; canonical: string; robots_index: boolean; robots_follow: boolean; };
export const PAGE_ROUTES = ['/', '/about', '/blog', '/pricing', '/contact', '/dashboard', '/task-work', '/task-list', '/payout', '/auth', '/admin'] as const;
export async function getAllPageSeo(): Promise<PageSeo[]> {
  try { const rows = await sql`SELECT * FROM seo_pages ORDER BY route`; return rows as PageSeo[]; } catch { return []; }
}
export async function getPageSeo(route: string): Promise<PageSeo | null> {
  try { const rows = await sql`SELECT * FROM seo_pages WHERE route = ${route} LIMIT 1`; return (rows[0] as PageSeo) || null; } catch { return null; }
}
export async function savePageSeo(route: string, data: Partial<PageSeo>) {
  const existing = await getPageSeo(route);
  const merged = { title: data.title ?? existing?.title ?? '', description: data.description ?? existing?.description ?? '', keywords: data.keywords ?? existing?.keywords ?? '', og_image: data.og_image ?? existing?.og_image ?? '/tasktimer-logo.svg', canonical: data.canonical ?? existing?.canonical ?? route, robots_index: data.robots_index ?? existing?.robots_index ?? true, robots_follow: data.robots_follow ?? existing?.robots_follow ?? true };
  await sql`INSERT INTO seo_pages (route, title, description, keywords, og_image, canonical, robots_index, robots_follow) VALUES (${route}, ${merged.title}, ${merged.description}, ${merged.keywords}, ${merged.og_image}, ${merged.canonical}, ${merged.robots_index}, ${merged.robots_follow}) ON CONFLICT (route) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, keywords=EXCLUDED.keywords, og_image=EXCLUDED.og_image, canonical=EXCLUDED.canonical, robots_index=EXCLUDED.robots_index, robots_follow=EXCLUDED.robots_follow`;
}
export async function buildPageMetadata(route: string) {
  const [global, page] = await Promise.all([getSeoSettings().catch(()=> DEFAULT_SEO), getPageSeo(route).catch(()=> null)]);
  const siteUrl = global.site_url;
  const title = page?.title || global.title;
  const description = page?.description || global.description;
  const keywords = (page?.keywords || global.keywords).split(',').map(k=>k.trim()).filter(Boolean);
  const ogImage = page?.og_image || global.og_image;
  const canonical = page?.canonical || route;
  const robots_index = page ? page.robots_index : global.robots_index;
  const robots_follow = page ? page.robots_follow : global.robots_follow;
  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical },
    openGraph: { title, description, url: siteUrl + canonical, siteName: global.site_name, images: [{ url: ogImage }] },
    twitter: { card: 'summary_large_image' as const, title, description, images: [ogImage] },
    robots: { index: robots_index, follow: robots_follow },
  };
}
