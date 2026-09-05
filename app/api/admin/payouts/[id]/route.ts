import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { adminOnly } from '@/lib/auth';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const auth = adminOnly(req);
        if (auth instanceof NextResponse) return auth;
        const { id } = await ctx.params;
        const { status } = await req.json();
        if (!['pending','approved','rejected','paid'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        const existing = await sql`SELECT * FROM payouts WHERE id = ${parseInt(id)}`;
        if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        await sql`UPDATE payouts SET status = ${status} WHERE id = ${parseInt(id)}`;
        const updated = await sql`SELECT p.*, u.username FROM payouts p JOIN users u ON u.id = p.user_id WHERE p.id = ${parseInt(id)}`;
        return NextResponse.json(updated[0]);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const auth = adminOnly(req);
        if (auth instanceof NextResponse) return auth;
        const { id } = await ctx.params;
        await sql`DELETE FROM payouts WHERE id = ${parseInt(id)}`;
        return NextResponse.json({ ok: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
