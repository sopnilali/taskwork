import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.VERCEL
    ? '/tmp/tasktimer.db'
    : path.join(process.cwd(), 'tasktimer.db');

let db: Database | null = null;

function saveDatabase() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

export async function getDb(): Promise<Database> {
    if (db) return db;

    const wasmPath = path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
    const SQL = await initSqlJs({
        locateFile: () => wasmPath,
    });

    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            task_name TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('completed', 'stopped')),
            started_at TEXT NOT NULL,
            ended_at TEXT NOT NULL,
            total_duration INTEGER NOT NULL,
            hourly_rate REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            activity_type TEXT NOT NULL CHECK(activity_type IN ('task_started', 'task_paused', 'task_resumed', 'task_stopped', 'task_completed')),
            activity_time TEXT NOT NULL,
            duration INTEGER DEFAULT 0,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
    `);

    try { db.run("ALTER TABLE tasks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE"); } catch {}
    try { db.run("ALTER TABLE tasks ADD COLUMN hourly_rate REAL DEFAULT 0"); } catch {}

    saveDatabase();
    return db;
}

export function queryAll(sql: string, params: (string | number)[] = []) {
    const database = db!;
    const stmt = database.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const results: Record<string, unknown>[] = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

export function queryOne(sql: string, params: (string | number)[] = []) {
    const database = db!;
    const stmt = database.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    let result: Record<string, unknown> | null = null;
    if (stmt.step()) {
        result = stmt.getAsObject();
    }
    stmt.free();
    return result;
}

export function runQuery(sql: string, params: (string | number)[] = []) {
    const database = db!;
    database.run(sql, params);
    saveDatabase();
}
