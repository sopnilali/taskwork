import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';
import { getAllPageSeo, savePageSeo, getPageSeo } from '@/lib/seo';

export async function GET(req: NextRequest) {
  await initDatabase();
  const a = adminOnly(req); if (a instanceof NextResponse) return a;
  return NextResponse.json(await getAllPageSeo());
}
export async function PUT(req: NextRequest) {
  await initDatabase();
  const a = adminOnly(req); if (a instanceof NextResponse) return a;
  const body = await req.json();
  const route = String(body.route || '').trim();
  if (!route.startsWith('/')) return NextResponse.json({ error: 'route must start with /' }, { status: 400 });
  if (body.title && String(body.title).length > 120) return NextResponse.json({ error: 'title too long' }, { status: 400 });
  if (body.description && String(body.description).length > 320) return NextResponse.json({ error: 'description too long' }, { status: 400 });
  await savePageSeo(route, { title: body.title, description: body.description, keywords: body.keywords, og_image: body.og_image, canonical: body.canonical, robots_index: body.robots_index, robots_follow: body.robots_follow });
  return NextResponse.json(await getPageSeo(route));
}
