import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { id } = await context.params;
        const result = await sql`SELECT * FROM tasks WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
        if (result.length === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        return NextResponse.json(result[0]);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { id } = await context.params;
        const taskId = parseInt(id);
        const { task_name, category, total_duration, hourly_rate, work_date } = await req.json();

        if (total_duration !== undefined) {
            const dur = parseInt(total_duration);
            if (isNaN(dur) || dur < 0 || dur > 86400) return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
            const existing = await sql`SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${user.id}`;
            if (existing.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            await sql`UPDATE tasks SET total_duration = ${dur} WHERE id = ${taskId} AND user_id = ${user.id}`;
        }

        if (hourly_rate !== undefined) {
            const rate = parseFloat(hourly_rate);
            if (isNaN(rate) || rate < 0) return NextResponse.json({ error: 'Invalid rate' }, { status: 400 });
            const existing = await sql`SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${user.id}`;
            if (existing.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            await sql`UPDATE tasks SET hourly_rate = ${rate} WHERE id = ${taskId} AND user_id = ${user.id}`;
        }

        if (work_date !== undefined) {
            const existing = await sql`SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${user.id}`;
            if (existing.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            await sql`UPDATE tasks SET work_date = ${work_date}::date WHERE id = ${taskId} AND user_id = ${user.id}`;
        }

        if (task_name !== undefined) {
            const name = String(task_name).trim();
            if (!name) return NextResponse.json({ error: 'Task name cannot be empty' }, { status: 400 });
            if (name.length > 100) return NextResponse.json({ error: 'Task name too long' }, { status: 400 });
            const existing = await sql`SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${user.id}`;
            if (existing.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            await sql`UPDATE tasks SET task_name = ${name} WHERE id = ${taskId} AND user_id = ${user.id}`;
        }

        if (category !== undefined) {
            const existing = await sql`SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${user.id}`;
            if (existing.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            await sql`UPDATE tasks SET category = ${category} WHERE id = ${taskId} AND user_id = ${user.id}`;
        }

        const result = await sql`SELECT *, work_date::text as work_date_text FROM tasks WHERE id = ${taskId} AND user_id = ${user.id}`;
        if (result.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        const row = result[0] as Record<string, unknown>;
        const task = { ...row, work_date: (row.work_date_text as string)?.slice(0, 10) || (row.work_date instanceof Date ? new Date((row.work_date as Date).getTime() - (row.work_date as Date).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null) };
        delete (task as Record<string, unknown>).work_date_text;
        return NextResponse.json(task);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { id } = await context.params;
        const taskId = parseInt(id);

        const existing = await sql`SELECT id FROM tasks WHERE id = ${taskId} AND user_id = ${user.id}`;
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        await sql`DELETE FROM activity_logs WHERE task_id = ${taskId}`;
        await sql`DELETE FROM tasks WHERE id = ${taskId} AND user_id = ${user.id}`;
        return NextResponse.json({ message: 'Task deleted' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
