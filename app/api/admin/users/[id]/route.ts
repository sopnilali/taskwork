import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const result = adminOnly(req);
        if (result instanceof NextResponse) return result;

        const { id } = await params;
        const userId = parseInt(id);
        if (isNaN(userId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

        const existing = await sql`SELECT id, username, is_admin FROM users WHERE id = ${userId}`;
        if (existing.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await req.json();
        const updates: string[] = [];

        if (body.username !== undefined) {
            if (body.username.length < 3 || body.username.length > 30) {
                return NextResponse.json({ error: 'Username must be 3-30 characters' }, { status: 400 });
            }
            const dup = await sql`SELECT id FROM users WHERE username = ${body.username} AND id != ${userId}`;
            if (dup.length > 0) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }

        let updatedUser;
        if (body.password && body.password.length >= 6) {
            const hash = await bcrypt.hash(body.password, 10);
            updatedUser = await sql`
                UPDATE users SET
                    username = COALESCE(${body.username || null}, username),
                    password_hash = ${hash},
                    is_admin = COALESCE(${body.is_admin ?? null}, is_admin)
                WHERE id = ${userId}
                RETURNING id, username, is_admin, created_at
            `;
        } else {
            updatedUser = await sql`
                UPDATE users SET
                    username = COALESCE(${body.username || null}, username),
                    is_admin = COALESCE(${body.is_admin ?? null}, is_admin)
                WHERE id = ${userId}
                RETURNING id, username, is_admin, created_at
            `;
        }

        return NextResponse.json({ user: updatedUser[0] });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const result = adminOnly(req);
        if (result instanceof NextResponse) return result;

        const { id } = await params;
        const userId = parseInt(id);
        if (isNaN(userId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

        if (userId === result.user.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
        }

        const existing = await sql`SELECT id FROM users WHERE id = ${userId}`;
        if (existing.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        await sql`DELETE FROM activity_logs WHERE task_id IN (SELECT id FROM tasks WHERE user_id = ${userId})`;
        await sql`DELETE FROM tasks WHERE user_id = ${userId}`;
        await sql`DELETE FROM users WHERE id = ${userId}`;

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
