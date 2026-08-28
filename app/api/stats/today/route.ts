import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await getDb();
        const user = authenticate(req);
        if (!user) return authResponse();

        const today = queryOne(
            "SELECT COALESCE(SUM(total_duration), 0) as total, COALESCE(SUM(total_duration * hourly_rate / 3600), 0) as earnings FROM tasks WHERE user_id = ? AND date(created_at) = date('now')",
            [user.id]
        ) as Record<string, unknown>;

        const week = queryOne(
            "SELECT COALESCE(SUM(total_duration), 0) as total, COALESCE(SUM(total_duration * hourly_rate / 3600), 0) as earnings, COUNT(*) as count FROM tasks WHERE user_id = ? AND created_at >= datetime('now', '-7 days')",
            [user.id]
        ) as Record<string, unknown>;

        const month = queryOne(
            "SELECT COALESCE(SUM(total_duration), 0) as total, COALESCE(SUM(total_duration * hourly_rate / 3600), 0) as earnings, COUNT(*) as count FROM tasks WHERE user_id = ? AND created_at >= datetime('now', '-30 days')",
            [user.id]
        ) as Record<string, unknown>;

        return NextResponse.json({
            today: { totalDuration: today.total, totalEarnings: today.earnings },
            week: { totalDuration: week.total, totalEarnings: week.earnings, count: week.count },
            month: { totalDuration: month.total, totalEarnings: month.earnings, count: month.count },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
