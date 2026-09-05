import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const auth = adminOnly(req);
        if (auth instanceof NextResponse) return auth;
        const rows = await sql`SELECT p.*, u.username FROM payouts p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC`;
        const stats = await sql`SELECT status, COALESCE(SUM(amount),0)::int as total, COUNT(*)::int as count FROM payouts GROUP BY status`;
        return NextResponse.json({ payouts: rows, stats });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
