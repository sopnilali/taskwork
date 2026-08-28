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

        const result = await sql`SELECT * FROM users WHERE username = ${username}`;
        if (result.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = result[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = signToken({ id: user.id, username: user.username });
        return NextResponse.json({ token, user: { id: user.id, username: user.username } });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
