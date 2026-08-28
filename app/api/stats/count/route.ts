import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await getDb();
        const user = authenticate(req);
        if (!user) return authResponse();

        const result = queryOne('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [user.id]) as Record<string, unknown>;
        return NextResponse.json({ count: result.count });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
