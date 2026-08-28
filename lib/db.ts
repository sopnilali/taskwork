import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export async function initDatabase() {
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
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
            created_at TEXT DEFAULT (now()::text)
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            activity_type TEXT NOT NULL CHECK(activity_type IN ('task_started', 'task_paused', 'task_resumed', 'task_stopped', 'task_completed')),
            activity_time TEXT NOT NULL,
            duration INTEGER DEFAULT 0
        )
    `;
}
