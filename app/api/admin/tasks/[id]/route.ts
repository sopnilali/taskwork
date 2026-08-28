import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const result = adminOnly(req);
        if (result instanceof NextResponse) return result;

        const { id } = await params;
        const taskId = parseInt(id);
        if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });

        const existing = await sql`SELECT id FROM tasks WHERE id = ${taskId}`;
        if (existing.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        await sql`DELETE FROM activity_logs WHERE task_id = ${taskId}`;
        await sql`DELETE FROM tasks WHERE id = ${taskId}`;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
