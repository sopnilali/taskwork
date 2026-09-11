import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';
import { getAllPageSeo } from '@/lib/seo';
export async function GET() { await initDatabase(); return NextResponse.json(await getAllPageSeo()); }
