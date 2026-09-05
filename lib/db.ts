import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export async function initDatabase() {
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT false,
            created_at TEXT DEFAULT (now()::text)
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            task_name TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('completed', 'stopped')),
            started_at TEXT NOT NULL,
            ended_at TEXT NOT NULL,
            total_duration INTEGER NOT NULL,
            hourly_rate REAL DEFAULT 0,
            work_date DATE DEFAULT CURRENT_DATE,
            created_at TEXT DEFAULT (now()::text)
        )
    `;

    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_date DATE DEFAULT CURRENT_DATE`;
    await sql`UPDATE tasks SET work_date = created_at::date WHERE work_date IS NULL`;

    await sql`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            activity_type TEXT NOT NULL CHECK(activity_type IN ('task_started', 'task_paused', 'task_resumed', 'task_stopped', 'task_completed')),
            activity_time TEXT NOT NULL,
            duration INTEGER DEFAULT 0
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS payouts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            amount INTEGER NOT NULL CHECK(amount > 0),
            method TEXT NOT NULL CHECK(method IN ('bkash','nagad','rocket','bank','paypal')),
            account TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','paid')),
            note TEXT DEFAULT '',
            created_at TEXT DEFAULT (now()::text)
        )
    `;
    await sql`ALTER TABLE payouts ADD COLUMN IF NOT EXISTS note TEXT DEFAULT ''`;
}
