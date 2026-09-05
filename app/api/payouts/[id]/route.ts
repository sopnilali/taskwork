import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();
        const { id } = await ctx.params;
        const { status } = await req.json();
        if (!['pending','paid'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        const rows = await sql`SELECT * FROM payouts WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        await sql`UPDATE payouts SET status = ${status} WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
        const updated = await sql`SELECT * FROM payouts WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
        return NextResponse.json(updated[0]);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();
        const { id } = await ctx.params;
        const rows = await sql`SELECT * FROM payouts WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
        if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        if (rows[0].status !== 'pending') return NextResponse.json({ error: 'Only pending can be deleted' }, { status: 400 });
        await sql`DELETE FROM payouts WHERE id = ${parseInt(id)} AND user_id = ${user.id}`;
        return NextResponse.json({ ok: true });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
