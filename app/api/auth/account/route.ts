import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        await sql`DELETE FROM activity_logs WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ${user.id})`;
        await sql`DELETE FROM tasks WHERE user_id = ${user.id}`;
        await sql`DELETE FROM users WHERE id = ${user.id}`;

        return NextResponse.json({ message: 'Account deleted' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
