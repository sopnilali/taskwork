import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, sql } from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }){
  await initDatabase();
  const { slug } = await params;
  const rows = await sql`SELECT * FROM blog_posts WHERE slug=${slug} LIMIT 1`;
  if (!rows.length) return NextResponse.json({ error:'Not found' },{status:404});
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }){
  await initDatabase();
  const user = authenticate(req);
  if (!user) return NextResponse.json({ error:'Access denied' },{status:401});
  const { slug } = await params;
  const existing = await sql`SELECT * FROM blog_posts WHERE slug=${slug} LIMIT 1`;
  if (!existing.length) return NextResponse.json({ error:'Not found' },{status:404});
  const isAdmin = (user as any).is_admin;
  if (!isAdmin && existing[0].author_id !== user.id) return NextResponse.json({ error:'Forbidden' },{status:403});
  const b = await req.json();
  const focusKw = b.focus_keyword ? String(b.focus_keyword).slice(0,80) : null;
  const seoScore = b.seo_score !== undefined ? Number(b.seo_score) : null;
  await sql`UPDATE blog_posts SET title=COALESCE(${b.title ?? null}, title), excerpt=COALESCE(${b.excerpt ?? null}, excerpt), content=COALESCE(${b.content ?? null}, content), category=COALESCE(${b.category ?? null}, category), image=COALESCE(${b.image ?? null}, image), read_time=COALESCE(${b.read_time ?? null}, read_time), seo_title=COALESCE(${b.seo_title ?? null}, seo_title), seo_description=COALESCE(${b.seo_description ?? null}, seo_description), seo_keywords=COALESCE(${b.seo_keywords ?? null}, seo_keywords), og_image=COALESCE(${b.og_image ?? null}, og_image), canonical=COALESCE(${b.canonical ?? null}, canonical), robots_index=COALESCE(${b.robots_index ?? null}, robots_index), robots_follow=COALESCE(${b.robots_follow ?? null}, robots_follow), focus_keyword=COALESCE(${focusKw}, focus_keyword), seo_score=COALESCE(${seoScore}, seo_score), published=COALESCE(${b.published ?? null}, published), updated_at=now()::text WHERE slug=${slug}`;
  const rows = await sql`SELECT * FROM blog_posts WHERE slug=${slug} LIMIT 1`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }){
  await initDatabase();
  const user = authenticate(req);
  if (!user) return NextResponse.json({ error:'Access denied' },{status:401});
  const { slug } = await params;
  const rows = await sql`SELECT * FROM blog_posts WHERE slug=${slug} LIMIT 1`;
  if (!rows.length) return NextResponse.json({ error:'Not found' },{status:404});
  const isAdmin = (user as any).is_admin;
  if (!isAdmin && rows[0].author_id !== user.id) return NextResponse.json({ error:'Forbidden' },{status:403});
  await sql`DELETE FROM blog_posts WHERE slug=${slug}`;
  return NextResponse.json({ message:'Deleted' });
}
