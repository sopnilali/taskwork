import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        await getDb();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { id } = await context.params;
        const task = queryOne('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [parseInt(id), user.id]);
        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        return NextResponse.json(task);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
