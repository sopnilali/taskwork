import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, sql } from '@/lib/db';
import { authenticate } from '@/lib/auth';

function slugify(t: string){ return t.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60); }

export async function GET(req: NextRequest){
  await initDatabase();
  const { searchParams } = new URL(req.url);
  const cat = searchParams.get('cat');
  const q = searchParams.get('q');
  const mine = searchParams.get('mine');
  if (mine === '1') {
    const user = authenticate(req);
    if (!user) return NextResponse.json({ error:'Access denied' },{status:401});
    const rows = await sql`SELECT slug, title, excerpt, content, category, author, image, date, read_time as read, seo_title, seo_description, seo_keywords, og_image, canonical, robots_index, robots_follow, published, created_at FROM blog_posts WHERE author_id=${user.id} ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  }
  let rows;
  if (cat) rows = await sql`SELECT slug, title, excerpt, content, category, author, image, date, read_time as read, seo_title, seo_description, seo_keywords, og_image, canonical, robots_index, robots_follow, published, created_at FROM blog_posts WHERE published=true AND category=${cat} ORDER BY created_at DESC`;
  else if (q) rows = await sql`SELECT slug, title, excerpt, content, category, author, image, date, read_time as read, seo_title, seo_description, seo_keywords, og_image, canonical, robots_index, robots_follow, published, created_at FROM blog_posts WHERE published=true AND (title ILIKE ${'%' + q + '%'} OR excerpt ILIKE ${'%' + q + '%'}) ORDER BY created_at DESC`;
  else rows = await sql`SELECT slug, title, excerpt, content, category, author, image, date, read_time as read, seo_title, seo_description, seo_keywords, og_image, canonical, robots_index, robots_follow, published, created_at FROM blog_posts WHERE published=true ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest){
  await initDatabase();
  const user = authenticate(req);
  if (!user) return NextResponse.json({ error:'Access denied' },{status:401});
  const b = await req.json();
  if (!b.title || !b.content) return NextResponse.json({ error:'Title and content required' },{status:400});
  const slug = b.slug ? slugify(String(b.slug)) : slugify(String(b.title));
  const pathFocus = slug.split('-').filter(Boolean).join(' ');
  const focusKw = String(b.focus_keyword || pathFocus || String(b.title).toLowerCase().split(/\s+/).slice(0,3).join(' ')).slice(0,80);
  const autoKw = b.seo_keywords ? String(b.seo_keywords) : (focusKw + ', ' + pathFocus + ', ' + String(b.category||'').toLowerCase()).split(',').map((s:string)=>s.trim()).filter(Boolean).slice(0,5).join(', ');
  const seoTitle = String(b.seo_title || b.title).slice(0,120);
  const seoDesc = String(b.seo_description || b.excerpt || b.title).slice(0,320);
  const seoKw = String(autoKw).slice(0,200);
  const seoScore = Math.min(100, Number(b.seo_score) || 0);
  try{
    await sql`INSERT INTO blog_posts (slug, title, excerpt, content, category, author, author_id, image, date, read_time, seo_title, seo_description, seo_keywords, og_image, canonical, robots_index, robots_follow, focus_keyword, seo_score, published) VALUES (${slug}, ${String(b.title)}, ${String(b.excerpt||b.title.slice(0,120))}, ${String(b.content)}, ${String(b.category||'General')}, ${user.username}, ${user.id}, ${String(b.image||'')}, ${String(b.date||new Date().toISOString().slice(0,10))}, ${String(b.read_time||'3 min')}, ${seoTitle}, ${seoDesc}, ${seoKw}, ${String(b.og_image||'/tasktimer-logo.svg')}, ${String(b.canonical||'/blog/'+slug)}, ${b.robots_index!==false}, ${b.robots_follow!==false}, ${focusKw}, ${seoScore}, ${b.published!==false})`;
    const rows = await sql`SELECT * FROM blog_posts WHERE slug=${slug} LIMIT 1`;
    return NextResponse.json(rows[0],{status:201});
  } catch(e:any){
    if (String(e.message).includes('duplicate')||String(e.message).includes('unique')) return NextResponse.json({error:'Slug already exists'},{status:409});
    return NextResponse.json({error:e.message},{status:500});
  }
}
