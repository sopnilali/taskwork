import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAll, queryOne, runQuery } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await getDb();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter');
        const category = searchParams.get('category');
        const userId = user.id;
        let tasks;

        if (category) {
            tasks = queryAll('SELECT * FROM tasks WHERE user_id = ? AND category = ? ORDER BY created_at DESC', [userId, category]);
        } else {
            switch (filter) {
                case 'today':
                    tasks = queryAll("SELECT * FROM tasks WHERE user_id = ? AND date(created_at) = date('now') ORDER BY created_at DESC", [userId]);
                    break;
                case 'week':
                    tasks = queryAll("SELECT * FROM tasks WHERE user_id = ? AND created_at >= datetime('now', '-7 days') ORDER BY created_at DESC", [userId]);
                    break;
                case 'completed':
                    tasks = queryAll("SELECT * FROM tasks WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC", [userId]);
                    break;
                case 'stopped':
                    tasks = queryAll("SELECT * FROM tasks WHERE user_id = ? AND status = 'stopped' ORDER BY created_at DESC", [userId]);
                    break;
                default:
                    tasks = queryAll('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId]);
            }
        }

        return NextResponse.json(tasks);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await getDb();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { task_name, category, status, started_at, ended_at, total_duration, hourly_rate } = await req.json();

        if (!task_name || !category || !status || !started_at || !ended_at || total_duration === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const rate = hourly_rate || 0;

        runQuery(
            'INSERT INTO tasks (user_id, task_name, category, status, started_at, ended_at, total_duration, hourly_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user.id, task_name, category, status, started_at, ended_at, total_duration, rate]
        );

        const taskId = (queryOne('SELECT last_insert_rowid() as id') as Record<string, unknown>)?.id;

        runQuery(
            'INSERT INTO activity_logs (task_id, activity_type, activity_time, duration) VALUES (?, ?, ?, ?)',
            [taskId, 'task_stopped', ended_at, total_duration]
        );

        const task = queryOne('SELECT * FROM tasks WHERE id = ?', [taskId as number]);
        return NextResponse.json(task, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await getDb();
        const user = authenticate(req);
        if (!user) return authResponse();

        runQuery('DELETE FROM activity_logs WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ?)', [user.id]);
        runQuery('DELETE FROM tasks WHERE user_id = ?', [user.id]);
        return NextResponse.json({ message: 'All tasks and activity logs cleared' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
