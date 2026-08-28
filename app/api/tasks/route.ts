import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter');
        const category = searchParams.get('category');
        const userId = user.id;

        let tasks;
        if (category) {
            tasks = await sql`SELECT * FROM tasks WHERE user_id = ${userId} AND category = ${category} ORDER BY created_at DESC`;
        } else {
            switch (filter) {
                case 'today':
                    tasks = await sql`SELECT * FROM tasks WHERE user_id = ${userId} AND date(created_at) = date('now') ORDER BY created_at DESC`;
                    break;
                case 'week':
                    tasks = await sql`SELECT * FROM tasks WHERE user_id = ${userId} AND created_at >= (now() - interval '7 days') ORDER BY created_at DESC`;
                    break;
                case 'completed':
                    tasks = await sql`SELECT * FROM tasks WHERE user_id = ${userId} AND status = 'completed' ORDER BY created_at DESC`;
                    break;
                case 'stopped':
                    tasks = await sql`SELECT * FROM tasks WHERE user_id = ${userId} AND status = 'stopped' ORDER BY created_at DESC`;
                    break;
                default:
                    tasks = await sql`SELECT * FROM tasks WHERE user_id = ${userId} ORDER BY created_at DESC`;
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
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { task_name, category, status, started_at, ended_at, total_duration, hourly_rate } = await req.json();

        if (!task_name || !category || !status || !started_at || !ended_at || total_duration === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const rate = hourly_rate || 0;

        const result = await sql`
            INSERT INTO tasks (user_id, task_name, category, status, started_at, ended_at, total_duration, hourly_rate)
            VALUES (${user.id}, ${task_name}, ${category}, ${status}, ${started_at}, ${ended_at}, ${total_duration}, ${rate})
            RETURNING *
        `;

        const task = result[0];

        await sql`
            INSERT INTO activity_logs (task_id, activity_type, activity_time, duration)
            VALUES (${task.id}, 'task_stopped', ${ended_at}, ${total_duration})
        `;

        return NextResponse.json(task, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        await sql`DELETE FROM activity_logs WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ${user.id})`;
        await sql`DELETE FROM tasks WHERE user_id = ${user.id}`;
        return NextResponse.json({ message: 'All tasks and activity logs cleared' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
