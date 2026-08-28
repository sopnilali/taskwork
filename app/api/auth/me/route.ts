import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await getDb();
        const user = authenticate(req);
        if (!user) return authResponse();

        const result = queryOne('SELECT id, username, created_at FROM users WHERE id = ?', [user.id]);
        if (!result) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json({ user: result });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
