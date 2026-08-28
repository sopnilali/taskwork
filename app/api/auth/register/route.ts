import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initDatabase } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await initDatabase();
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

        const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await sql`INSERT INTO users (username, password_hash) VALUES (${username}, ${passwordHash}) RETURNING id, username`;

        const user = result[0];
        const token = signToken({ id: user.id, username: user.username });

        return NextResponse.json({ token, user: { id: user.id, username: user.username } }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
