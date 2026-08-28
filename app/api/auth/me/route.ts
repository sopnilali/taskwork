import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        const result = await sql`SELECT id, username, created_at FROM users WHERE id = ${user.id}`;
        if (result.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json({ user: result[0] });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
