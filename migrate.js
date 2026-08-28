const { neon } = require('@neondatabase/serverless');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://neondb_owner:npg_tj5dvBDNGTF2@ep-proud-darkness-b3rmsn4v-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const DB_PATH = path.join(__dirname, 'tasktimer.db');

async function migrate() {
    console.log('Reading local SQLite database...');
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(DB_PATH);
    const localDb = new SQL.Database(fileBuffer);

    const sql = neon(DATABASE_URL);

    // Create tables
    console.log('Creating tables in Neon...');
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

    // Read users
    const localUsers = [];
    const stmt = localDb.prepare('SELECT * FROM users');
    while (stmt.step()) {
        localUsers.push(stmt.getAsObject());
    }
    stmt.free();

    console.log(`Found ${localUsers.length} users`);

    // Migrate users
    for (const user of localUsers) {
        console.log(`Migrating user: ${user.username}`);
        await sql`INSERT INTO users (id, username, password_hash, created_at) VALUES (${user.id}, ${user.username}, ${user.password_hash}, ${user.created_at}) ON CONFLICT (username) DO NOTHING`;
    }

    // Reset sequence
    if (localUsers.length > 0) {
        const maxId = Math.max(...localUsers.map(u => u.id));
        await sql`SELECT setval('users_id_seq', ${maxId})`;
    }

    // Read tasks
    const localTasks = [];
    const stmt2 = localDb.prepare('SELECT * FROM tasks');
    while (stmt2.step()) {
        localTasks.push(stmt2.getAsObject());
    }
    stmt2.free();

    console.log(`Found ${localTasks.length} tasks`);

    // Migrate tasks
    for (const task of localTasks) {
        await sql`
            INSERT INTO tasks (id, user_id, task_name, category, status, started_at, ended_at, total_duration, hourly_rate, created_at)
            VALUES (${task.id}, ${task.user_id}, ${task.task_name}, ${task.category}, ${task.status}, ${task.started_at}, ${task.ended_at}, ${task.total_duration}, ${task.hourly_rate || 0}, ${task.created_at})
            ON CONFLICT DO NOTHING
        `;
    }

    if (localTasks.length > 0) {
        const maxId = Math.max(...localTasks.map(t => t.id));
        await sql`SELECT setval('tasks_id_seq', ${maxId})`;
    }

    // Read activity_logs
    const localLogs = [];
    const stmt3 = localDb.prepare('SELECT * FROM activity_logs');
    while (stmt3.step()) {
        localLogs.push(stmt3.getAsObject());
    }
    stmt3.free();

    console.log(`Found ${localLogs.length} activity logs`);

    for (const log of localLogs) {
        if (!log.task_id || log.task_id === 0) continue;
        await sql`
            INSERT INTO activity_logs (id, task_id, activity_type, activity_time, duration)
            VALUES (${log.id}, ${log.task_id}, ${log.activity_type}, ${log.activity_time}, ${log.duration || 0})
            ON CONFLICT DO NOTHING
        `;
    }

    if (localLogs.length > 0) {
        const maxId = Math.max(...localLogs.map(l => l.id));
        await sql`SELECT setval('activity_logs_id_seq', ${maxId})`;
    }

    console.log('Migration complete!');
    console.log(`  Users: ${localUsers.length}`);
    console.log(`  Tasks: ${localTasks.length}`);
    console.log(`  Activity Logs: ${localLogs.length}`);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
