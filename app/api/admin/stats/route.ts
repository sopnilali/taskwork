import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const result = adminOnly(req);
        if (result instanceof NextResponse) return result;

        const users = await sql`SELECT COUNT(*)::int AS count FROM users`;
        const tasks = await sql`SELECT COUNT(*)::int AS count FROM tasks`;
        const todayTasks = await sql`
            SELECT COUNT(*)::int AS count,
                   COALESCE(SUM(total_duration), 0)::int AS seconds,
                   COALESCE(SUM(ROUND(total_duration * hourly_rate / 3600)), 0)::int AS earnings
            FROM tasks WHERE created_at::date = CURRENT_DATE
        `;
        const weekTasks = await sql`
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
            totalTasks: tasks[0].count,
            today: todayTasks[0],
            week: weekTasks[0],
            allTime: allTime[0],
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
