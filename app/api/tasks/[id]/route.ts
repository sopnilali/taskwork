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
