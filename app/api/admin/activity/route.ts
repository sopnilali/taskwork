import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const result = adminOnly(req);
        if (result instanceof NextResponse) return result;

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');
        const limit = parseInt(searchParams.get('limit') || '100');

        let logs;
        if (userId) {
            const uid = parseInt(userId);
            logs = await sql`
                SELECT a.*, t.task_name, t.category, t.hourly_rate, u.username
                FROM activity_logs a
                JOIN tasks t ON t.id = a.task_id
                JOIN users u ON u.id = t.user_id
                WHERE t.user_id = ${uid}
                ORDER BY a.activity_time::timestamp DESC
                LIMIT ${limit}
            `;
        } else {
            logs = await sql`
                SELECT a.*, t.task_name, t.category, t.hourly_rate, u.username
                FROM activity_logs a
                JOIN tasks t ON t.id = a.task_id
                JOIN users u ON u.id = t.user_id
                ORDER BY a.activity_time::timestamp DESC
                LIMIT ${limit}
            `;
        }

        return NextResponse.json({ logs });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
