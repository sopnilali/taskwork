import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await getDb();
        const user = authenticate(req);
        if (!user) return authResponse();

        const result = queryOne(
            "SELECT COALESCE(SUM(total_duration), 0) as total, COALESCE(SUM(total_duration * hourly_rate / 3600), 0) as earnings FROM tasks WHERE user_id = ? AND date(created_at) = date('now')",
            [user.id]
        ) as Record<string, unknown>;
        return NextResponse.json({ totalDuration: result.total, totalEarnings: result.earnings });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
