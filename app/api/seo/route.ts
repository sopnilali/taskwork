import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import { getSeoSettings } from '@/lib/seo';

export async function GET() {
  await initDatabase();
  const seo = await getSeoSettings();
  return NextResponse.json(seo);
}
