import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

function normalizeTasks(rows: Record<string, unknown>[]) {
    return rows.map(r => {
        const w = r.work_date;
        let workDate: string | null = null;
        if (w instanceof Date) {
            const offset = w.getTimezoneOffset();
            const local = new Date(w.getTime() - offset * 60000);
            workDate = local.toISOString().slice(0, 10);
        } else if (typeof w === 'string') {
            workDate = w.slice(0, 10);
        }
        return { ...r, work_date: workDate };
    });
}

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter');
        const category = searchParams.get('category');
        const date = searchParams.get('date');
        const userId = user.id;

        let tasks;
        if (date) {
            tasks = await sql`SELECT *, work_date::text as work_date_text FROM tasks WHERE user_id = ${userId} AND COALESCE(work_date, created_at::date) = ${date}::date ORDER BY created_at DESC`;
        } else if (category) {
            tasks = await sql`SELECT *, work_date::text as work_date_text FROM tasks WHERE user_id = ${userId} AND category = ${category} ORDER BY COALESCE(work_date, created_at::date) DESC, created_at DESC`;
        } else {
            switch (filter) {
                case 'today':
                    tasks = await sql`SELECT *, work_date::text as work_date_text FROM tasks WHERE user_id = ${userId} AND COALESCE(work_date, created_at::date) = CURRENT_DATE ORDER BY created_at DESC`;
                    break;
                case 'week':
                    tasks = await sql`SELECT *, work_date::text as work_date_text FROM tasks WHERE user_id = ${userId} AND COALESCE(work_date, created_at::date) >= CURRENT_DATE - INTERVAL '7 days' ORDER BY COALESCE(work_date, created_at::date) DESC, created_at DESC`;
                    break;
                case 'completed':
                    tasks = await sql`SELECT *, work_date::text as work_date_text FROM tasks WHERE user_id = ${userId} AND status = 'completed' ORDER BY COALESCE(work_date, created_at::date) DESC, created_at DESC`;
                    break;
                case 'stopped':
                    tasks = await sql`SELECT *, work_date::text as work_date_text FROM tasks WHERE user_id = ${userId} AND status = 'stopped' ORDER BY COALESCE(work_date, created_at::date) DESC, created_at DESC`;
                    break;
                default:
                    tasks = await sql`SELECT *, work_date::text as work_date_text FROM tasks WHERE user_id = ${userId} ORDER BY COALESCE(work_date, created_at::date) DESC, created_at DESC`;
            }
        }

        const mapped = tasks.map((r: Record<string, unknown>) => {
            const txt = r.work_date_text as string | null;
            const raw = r.work_date;
            let workDate: string | null = null;
            if (txt) workDate = txt.slice(0, 10);
            else if (raw instanceof Date) workDate = new Date(raw.getTime() - raw.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
            else if (typeof raw === 'string') workDate = raw.slice(0, 10);
            const { work_date_text, ...rest } = r as Record<string, unknown> & { work_date_text?: string };
            return { ...rest, work_date: workDate };
        });

        return NextResponse.json(mapped);
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

        const { task_name, category, status, started_at, ended_at, total_duration, hourly_rate, work_date } = await req.json();

        if (!task_name || !category || !status || !started_at || !ended_at || total_duration === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const rate = hourly_rate || 0;
        const workDate = work_date && /^\d{4}-\d{2}-\d{2}$/.test(work_date) ? work_date : new Date().toLocaleDateString('en-CA');

        const result = await sql`
            INSERT INTO tasks (user_id, task_name, category, status, started_at, ended_at, total_duration, hourly_rate, work_date)
            VALUES (${user.id}, ${task_name}, ${category}, ${status}, ${started_at}, ${ended_at}, ${total_duration}, ${rate}, ${workDate}::date)
            RETURNING *, work_date::text as work_date_text
        `;

        const row = result[0] as Record<string, unknown>;
        const task = { ...row, work_date: (row.work_date_text as string)?.slice(0, 10) || workDate };
        delete (task as Record<string, unknown>).work_date_text;

        await sql`
            INSERT INTO activity_logs (task_id, activity_type, activity_time, duration)
            VALUES (${(task as Record<string, unknown>).id as number}, 'task_stopped', ${ended_at}, ${total_duration})
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
