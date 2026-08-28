import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

let initialized = false;

export async function GET(req: NextRequest) {
    try {
        if (!initialized) {
            await initDatabase();
            initialized = true;
        }

        const user = authenticate(req);
        if (!user) return authResponse();

        const today = await sql`
            SELECT COALESCE(SUM(total_duration), 0) as total, COALESCE(SUM(total_duration * hourly_rate / 3600), 0) as earnings, COUNT(*) as count
            FROM tasks WHERE user_id = ${user.id} AND date(created_at) = date('now')
        `;

        const week = await sql`
            SELECT COALESCE(SUM(total_duration), 0) as total, COALESCE(SUM(total_duration * hourly_rate / 3600), 0) as earnings, COUNT(*) as count
            FROM tasks WHERE user_id = ${user.id} AND created_at >= (now() - interval '7 days')
        `;

        const month = await sql`
            SELECT COALESCE(SUM(total_duration), 0) as total, COALESCE(SUM(total_duration * hourly_rate / 3600), 0) as earnings, COUNT(*) as count
            FROM tasks WHERE user_id = ${user.id} AND created_at >= (now() - interval '30 days')
        `;

        const total = await sql`
            SELECT COALESCE(SUM(total_duration * hourly_rate / 3600), 0) as earnings
            FROM tasks WHERE user_id = ${user.id}
        `;

        return NextResponse.json({
            today: { totalDuration: today[0].total, totalEarnings: today[0].earnings, count: today[0].count },
            week: { totalDuration: week[0].total, totalEarnings: week[0].earnings, count: week[0].count },
            month: { totalDuration: month[0].total, totalEarnings: month[0].earnings, count: month[0].count },
            total: { totalEarnings: total[0].earnings },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
