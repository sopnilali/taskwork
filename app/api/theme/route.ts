import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import { getThemeSettings } from '@/lib/theme';
export async function GET() { await initDatabase(); return NextResponse.json(await getThemeSettings()); }
