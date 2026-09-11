import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';
import { getThemeSettings, saveThemeSettings, THEME_PRESETS } from '@/lib/theme';

export async function GET(req: NextRequest) {
  await initDatabase();
  const a = adminOnly(req); if (a instanceof NextResponse) return a;
  return NextResponse.json(await getThemeSettings());
}
export async function PUT(req: NextRequest) {
  await initDatabase();
  const a = adminOnly(req); if (a instanceof NextResponse) return a;
  const body = await req.json();
  const allowed = ['preset','mode','primary','primary_hover','primary_light','success','warning','danger','info','background','surface','text','radius','radius_lg','font_family','density','shadows','gradient'];
  const data: Record<string,string> = {};
  for (const k of allowed) if (body[k] !== undefined) data[k] = String(body[k]);
  if (data.preset && THEME_PRESETS[data.preset]) {
    const p = THEME_PRESETS[data.preset]; if (p.primary) data.primary = p.primary; if (p.primary_hover) data.primary_hover = p.primary_hover; if (p.primary_light) data.primary_light = p.primary_light;
  }
  await saveThemeSettings(data as never);
  return NextResponse.json(await getThemeSettings());
}
