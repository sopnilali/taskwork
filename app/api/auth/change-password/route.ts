import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
        }

        const result = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
        if (result.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const valid = await bcrypt.compare(currentPassword, result[0].password_hash);
        if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });

        const hash = await bcrypt.hash(newPassword, 10);
        await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
