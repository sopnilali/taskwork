import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        const result = await sql`SELECT COUNT(*)::int as count FROM tasks WHERE user_id = ${user.id}`;
        return NextResponse.json({ count: result[0].count });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
