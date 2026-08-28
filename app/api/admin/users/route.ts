import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const result = adminOnly(req);
        if (result instanceof NextResponse) return result;

        const users = await sql`
            SELECT u.id, u.username, u.is_admin, u.created_at,
                   COUNT(t.id)::int AS task_count,
                   COALESCE(SUM(t.total_duration), 0)::int AS total_seconds,
                   COALESCE(SUM(ROUND(t.total_duration * t.hourly_rate / 3600)), 0)::int AS total_earnings
            FROM users u
            LEFT JOIN tasks t ON t.user_id = u.id
            GROUP BY u.id, u.username, u.is_admin, u.created_at
            ORDER BY u.id
        `;
        return NextResponse.json({ users });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await initDatabase();
        const result = adminOnly(req);
        if (result instanceof NextResponse) return result;

        const { username, password, is_admin } = await req.json();

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
        const newUser = await sql`
            INSERT INTO users (username, password_hash, is_admin)
            VALUES (${username}, ${passwordHash}, ${is_admin || false})
            RETURNING id, username, is_admin, created_at
        `;

        return NextResponse.json({ user: newUser[0] }, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
