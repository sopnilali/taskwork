import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';
import { getSeoSettings, saveSeoSettings } from '@/lib/seo';

export async function GET(req: NextRequest) {
  await initDatabase();
  const auth = adminOnly(req);
  if (auth instanceof NextResponse) return auth;
  const seo = await getSeoSettings();
  return NextResponse.json(seo);
}

export async function PUT(req: NextRequest) {
  await initDatabase();
  const auth = adminOnly(req);
  if (auth instanceof NextResponse) return auth;
  const body = await req.json();
  const allowed = [
    'site_name','site_url','title','description','keywords','og_image','twitter_handle',
    'canonical_url','robots_index','robots_follow','google_verification','bing_verification',
    'theme_color','author','json_ld_enabled'
  ];
  const data: Record<string,string> = {};
  for (const k of allowed) if (body[k] !== undefined) data[k] = String(body[k]);
  if (!data.title || !data.description) {
    // allow partial but validate if provided
  }
  if (data.title && data.title.length > 120) return NextResponse.json({ error: 'Title too long (max 120)' }, { status: 400 });
  if (data.description && data.description.length > 320) return NextResponse.json({ error: 'Description too long (max 320)' }, { status: 400 });
  if (data.site_url) {
    try { new URL(data.site_url); } catch { return NextResponse.json({ error: 'Invalid site_url' }, { status: 400 }); }
  }
  await saveSeoSettings(data as never);
  const updated = await getSeoSettings();
  return NextResponse.json(updated);
}
