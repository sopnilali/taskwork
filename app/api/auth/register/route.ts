import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, queryOne, runQuery } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await getDb();
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }
        if (username.length < 3 || username.length > 30) {
            return NextResponse.json({ error: 'Username must be 3-30 characters' }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        const existing = queryOne('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        runQuery('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);

        const user = queryOne('SELECT id, username, created_at FROM users WHERE username = ?', [username]) as Record<string, unknown>;
        const token = signToken({ id: user.id as number, username: user.username as string });

        return NextResponse.json({ token, user: { id: user.id, username: user.username } }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
