import { sql } from '@/lib/db';
export type BlogPost = { slug: string; title: string; excerpt: string; content: string; category: string; date: string; read: string; image: string; author: string; seo_title?: string; seo_description?: string; seo_keywords?: string; og_image?: string; canonical?: string; robots_index?: boolean; robots_follow?: boolean; published?: boolean; focus_keyword?: string; seo_score?: number; };
export const staticBlogs: BlogPost[] = [];
export const blogs = staticBlogs;
export const categories = ['Productivity','Freelance','Focus','Teams','SEO','General'];

export async function getBlogsFromDb(cat?: string, q?: string): Promise<BlogPost[]> {
  try {
    let rows:any[];
    if (cat) rows = await sql`SELECT slug, title, excerpt, content, category, author, image, date, read_time as read, seo_title, seo_description, seo_keywords, og_image, canonical, robots_index, robots_follow, published, focus_keyword, seo_score FROM blog_posts WHERE published = true AND category=${cat} ORDER BY created_at DESC`;
    else if (q) rows = await sql`SELECT slug, title, excerpt, content, category, author, image, date, read_time as read, seo_title, seo_description, seo_keywords, og_image, canonical, robots_index, robots_follow, published, focus_keyword, seo_score FROM blog_posts WHERE published = true AND (title ILIKE ${'%' + q + '%'} OR excerpt ILIKE ${'%' + q + '%'} OR seo_keywords ILIKE ${'%' + q + '%'}) ORDER BY created_at DESC`;
    else rows = await sql`SELECT slug, title, excerpt, content, category, author, image, date, read_time as read, seo_title, seo_description, seo_keywords, og_image, canonical, robots_index, robots_follow, published, focus_keyword, seo_score FROM blog_posts WHERE published = true ORDER BY created_at DESC`;
    if (!rows.length) return [];
    return rows.map((r:any)=> ({ slug:r.slug, title:r.title, excerpt:r.excerpt, content:r.content, category:r.category, author:r.author, image:r.image, date:r.date?.slice(0,10) || new Date().toISOString().slice(0,10), read:r.read || '3 min', seo_title:r.seo_title, seo_description:r.seo_description, seo_keywords:r.seo_keywords, og_image:r.og_image, canonical:r.canonical, robots_index:r.robots_index, robots_follow:r.robots_follow, published:r.published, focus_keyword:r.focus_keyword, seo_score:r.seo_score }));
  } catch { return []; }
}
export async function getBlogFromDb(slug: string): Promise<BlogPost | null> {
  try {
    const rows = await sql`SELECT slug, title, excerpt, content, category, author, image, date, read_time as read, seo_title, seo_description, seo_keywords, og_image, canonical, robots_index, robots_follow, focus_keyword, seo_score FROM blog_posts WHERE slug=${slug} LIMIT 1`;
    if (!rows.length) return null;
    const r:any = rows[0];
    return { slug:r.slug, title:r.title, excerpt:r.excerpt, content:r.content, category:r.category, author:r.author, image:r.image, date:r.date?.slice(0,10) || '', read:r.read || '3 min', seo_title:r.seo_title, seo_description:r.seo_description, seo_keywords:r.seo_keywords, og_image:r.og_image, canonical:r.canonical, robots_index:r.robots_index, robots_follow:r.robots_follow, focus_keyword:r.focus_keyword, seo_score:r.seo_score };
  } catch { return null; }
}
