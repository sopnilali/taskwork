import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';
import { authenticate, authResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();
        const rows = await sql`SELECT * FROM payouts WHERE user_id = ${user.id} ORDER BY created_at DESC`;
        const earnings = await sql`SELECT COALESCE(SUM(total_duration * hourly_rate / 3600),0)::int as total FROM tasks WHERE user_id = ${user.id}`;
        const paid = await sql`SELECT COALESCE(SUM(amount),0)::int as total FROM payouts WHERE user_id = ${user.id} AND status = 'paid'`;
        const pending = await sql`SELECT COALESCE(SUM(amount),0)::int as total FROM payouts WHERE user_id = ${user.id} AND status IN ('pending','approved')`;
        return NextResponse.json({ payouts: rows, totalEarnings: earnings[0].total, totalPaid: paid[0].total, totalPending: pending[0].total });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
    try {
        await initDatabase();
        const user = authenticate(req);
        if (!user) return authResponse();
        const { amount, method, account, note } = await req.json();
        const amt = parseInt(amount);
        if (!amt || amt <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        if (!['bkash','nagad','rocket','bank','paypal'].includes(method)) return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
        if (!account || String(account).trim().length < 3) return NextResponse.json({ error: 'Account required' }, { status: 400 });

        const earnings = await sql`SELECT COALESCE(SUM(total_duration * hourly_rate / 3600),0)::int as total FROM tasks WHERE user_id = ${user.id}`;
        const paidPending = await sql`SELECT COALESCE(SUM(amount),0)::int as total FROM payouts WHERE user_id = ${user.id} AND status IN ('paid','pending','approved')`;
        const available = earnings[0].total - paidPending[0].total;
        if (amt > available) return NextResponse.json({ error: `Insufficient balance. Available: ৳${available}` }, { status: 400 });

        const rows = await sql`INSERT INTO payouts (user_id, amount, method, account, note) VALUES (${user.id}, ${amt}, ${method}, ${String(account).trim()}, ${String(note||'').slice(0,200)}) RETURNING *`;
        return NextResponse.json(rows[0]);
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
