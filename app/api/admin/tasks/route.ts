import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const result = adminOnly(req);
        if (result instanceof NextResponse) return result;

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter') || 'all';
        const userId = searchParams.get('user_id');

        let tasks;
        if (userId) {
            const uid = parseInt(userId);
            if (filter === 'today') {
                tasks = await sql`
                    SELECT t.*, u.username FROM tasks t
                    JOIN users u ON u.id = t.user_id
                    WHERE t.user_id = ${uid} AND t.created_at::date = CURRENT_DATE
                    ORDER BY t.created_at::timestamp DESC
                `;
            } else if (filter === 'week') {
                tasks = await sql`
                    SELECT t.*, u.username FROM tasks t
                    JOIN users u ON u.id = t.user_id
                    WHERE t.user_id = ${uid} AND t.created_at::timestamp >= NOW() - INTERVAL '7 days'
                    ORDER BY t.created_at::timestamp DESC
                `;
            } else {
                tasks = await sql`
                    SELECT t.*, u.username FROM tasks t
                    JOIN users u ON u.id = t.user_id
                    WHERE t.user_id = ${uid}
                    ORDER BY t.created_at::timestamp DESC
                `;
            }
        } else {
            if (filter === 'today') {
                tasks = await sql`
                    SELECT t.*, u.username FROM tasks t
                    JOIN users u ON u.id = t.user_id
                    WHERE t.created_at::date = CURRENT_DATE
                    ORDER BY t.created_at::timestamp DESC
                `;
            } else if (filter === 'week') {
                tasks = await sql`
                    SELECT t.*, u.username FROM tasks t
                    JOIN users u ON u.id = t.user_id
                    WHERE t.created_at::timestamp >= NOW() - INTERVAL '7 days'
                    ORDER BY t.created_at::timestamp DESC
                `;
            } else {
                tasks = await sql`
                    SELECT t.*, u.username FROM tasks t
                    JOIN users u ON u.id = t.user_id
                    ORDER BY t.created_at::timestamp DESC
                `;
            }
        }

        return NextResponse.json({ tasks });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
