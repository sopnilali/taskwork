import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, queryOne } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await getDb();
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
        }

        const user = queryOne('SELECT * FROM users WHERE username = ?', [username]) as Record<string, unknown> | null;
        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, user.password_hash as string);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = signToken({ id: user.id as number, username: user.username as string });
        return NextResponse.json({ token, user: { id: user.id, username: user.username } });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
