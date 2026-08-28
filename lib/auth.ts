import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'tasktimer-dev-secret';
const JWT_EXPIRY = '7d';

export interface UserPayload {
    id: number;
    username: string;
    is_admin: boolean;
}

export function signToken(user: UserPayload): string {
    return jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): UserPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch {
        return null;
    }
}

export function getTokenFromRequest(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1];
}

export function authenticate(req: NextRequest): UserPayload | null {
    const token = getTokenFromRequest(req);
    if (!token) return null;
    return verifyToken(token);
}

export function authResponse() {
    return NextResponse.json({ error: 'Access denied' }, { status: 401 });
}

export function adminOnly(req: NextRequest): { user: UserPayload } | NextResponse {
    const user = authenticate(req);
    if (!user) return authResponse();
    if (!user.is_admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    return { user };
}
