import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const result = adminOnly(req);
        if (result instanceof NextResponse) return result;

        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || 'all';

        const users = await sql`SELECT COUNT(*)::int AS count FROM users`;
        const totalTasks = await sql`SELECT COUNT(*)::int AS count FROM tasks`;

        let interval = '';
        if (range === 'today') interval = `AND created_at::date = CURRENT_DATE`;
        else if (range === 'week') interval = `AND created_at::timestamp >= NOW() - INTERVAL '7 days'`;
        else if (range === 'month') interval = `AND created_at::timestamp >= NOW() - INTERVAL '30 days'`;

        const filtered = await sql`
            SELECT COUNT(*)::int AS count,
                   COALESCE(SUM(total_duration), 0)::int AS seconds,
                   COALESCE(SUM(ROUND(total_duration * hourly_rate / 3600)), 0)::int AS earnings
            FROM tasks WHERE 1=1 ${sql.unsafe(interval)}
        `;

        const today = await sql`
            SELECT COUNT(*)::int AS count,
                   COALESCE(SUM(total_duration), 0)::int AS seconds,
                   COALESCE(SUM(ROUND(total_duration * hourly_rate / 3600)), 0)::int AS earnings
            FROM tasks WHERE created_at::date = CURRENT_DATE
        `;

        const week = await sql`
            SELECT COUNT(*)::int AS count,
                   COALESCE(SUM(total_duration), 0)::int AS seconds,
                   COALESCE(SUM(ROUND(total_duration * hourly_rate / 3600)), 0)::int AS earnings
            FROM tasks WHERE created_at::timestamp >= NOW() - INTERVAL '7 days'
        `;

        const allTime = await sql`
            SELECT COUNT(*)::int AS count,
                   COALESCE(SUM(total_duration), 0)::int AS seconds,
                   COALESCE(SUM(ROUND(total_duration * hourly_rate / 3600)), 0)::int AS earnings
            FROM tasks
        `;

        return NextResponse.json({
            totalUsers: users[0].count,
            totalTasks: totalTasks[0].count,
            filtered: filtered[0],
            today: today[0],
            week: week[0],
            allTime: allTime[0],
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
