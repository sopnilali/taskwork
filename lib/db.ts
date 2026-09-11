import { neon } from '@neondatabase/serverless';

let _sql: any = null;
function getSql(): any {
  if (_sql) return _sql;
  if (typeof window !== 'undefined') {
    const dummy: any = async () => [];
    dummy.unsafe = async () => [];
    _sql = dummy;
    return _sql;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL missing — add it to .env.local (taskwork/.env.local) or Vercel env. Loaded env keys: ' + Object.keys(process.env).filter(k=>k.includes('DATABASE') || k.includes('POSTGRES')).join(','));
  }
  _sql = neon(url);
  return _sql;
}
export const sql: any = new Proxy(() => {}, {
  apply(_t, _this, args) { return (getSql() as unknown as (...a: unknown[]) => unknown)(...args); },
  get(_t, prop) { return (getSql() as unknown as Record<string, unknown>)[prop as string]; },
});

export async function initDatabase() {
    if (typeof window !== 'undefined') return;
    if (!process.env.DATABASE_URL) return;
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

    await sql`
        CREATE TABLE IF NOT EXISTS seo_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT (now()::text)
        )
    `;
    const existing = await sql`SELECT COUNT(*)::int AS c FROM seo_settings`;
    if (existing[0].c === 0) {
        const defaults: Record<string, string> = {
            site_name: 'TaskTimer',
            site_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://tasktimer.example.com',
            title: 'TaskTimer — Free Online Task Timer & Productivity Tracker',
            description: 'Free online task timer to track work time, manage hourly earnings, and boost productivity. Start, pause, resume timers with daily stats and activity logs. No signup hassle.',
            keywords: 'task timer, time tracker, productivity timer, work timer, pomodoro timer, hourly rate calculator, time tracking, task management, free online timer, freelance time tracker',
            og_image: '/tasktimer-logo.svg',
            twitter_handle: '@tasktimer',
            canonical_url: '/',
            robots_index: 'true',
            robots_follow: 'true',
            google_verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
            bing_verification: '',
            theme_color: '#6366f1',
            author: 'TaskTimer',
            json_ld_enabled: 'true',
        };
        for (const [k, v] of Object.entries(defaults)) {
            await sql`INSERT INTO seo_settings (key, value) VALUES (${k}, ${v}) ON CONFLICT (key) DO NOTHING`;
        }
    }

    await sql`CREATE TABLE IF NOT EXISTS theme_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (now()::text))`;
    const themeExisting = await sql`SELECT COUNT(*)::int AS c FROM theme_settings`;
    if (themeExisting[0].c === 0) {
        const td: Record<string,string> = { preset:'indigo', mode:'light', primary:'#6366f1', primary_hover:'#4f46e5', primary_light:'#e0e7ff', success:'#22c55e', warning:'#f59e0b', danger:'#ef4444', info:'#3b82f6', background:'#f3f4f6', surface:'#ffffff', text:'#1f2937', radius:'12px', radius_lg:'16px', font_family:'Inter', density:'comfortable', shadows:'soft', gradient:'true' };
        for (const [k,v] of Object.entries(td)) await sql`INSERT INTO theme_settings (key, value) VALUES (${k}, ${v}) ON CONFLICT (key) DO NOTHING`;
    }

    await sql`CREATE TABLE IF NOT EXISTS seo_pages (route TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, keywords TEXT NOT NULL, og_image TEXT NOT NULL, canonical TEXT NOT NULL, robots_index BOOLEAN DEFAULT true, robots_follow BOOLEAN DEFAULT true)`;
    {
        const pages: Record<string, { title: string; description: string; keywords: string }> = {
            '/': { title: 'TaskTimer — Free Online Task Timer & Productivity Tracker', description: 'Free online task timer to track work time, manage hourly earnings, and boost productivity.', keywords: 'task timer, time tracker, productivity timer, free timer, time tracker' },
            '/about': { title: 'About — TaskTimer', description: 'About TaskTimer — free time tracker for freelancers and teams.', keywords: 'about tasktimer, time tracker story' },
            '/blog': { title: 'Blog — TaskTimer', description: 'Productivity tips, freelancing guides and time-tracking insights.', keywords: 'blog, productivity, freelancing, time tracking' },
            '/pricing': { title: 'Pricing — TaskTimer', description: 'Simple pricing for time tracking. Free forever, Pro for teams.', keywords: 'pricing, plans, subscription' },
            '/contact': { title: 'Contact — TaskTimer', description: 'Contact TaskTimer support.', keywords: 'contact, support' },
            '/dashboard': { title: 'Dashboard — TaskTimer', description: 'Your productivity overview: today stats, earnings and recent tasks.', keywords: 'dashboard, productivity overview, time stats' },
            '/task-work': { title: 'Task Work — Start Timer | TaskTimer', description: 'Start, pause and track your work timer with hourly rate calculation.', keywords: 'task work, timer, hourly rate, work tracker' },
            '/task-list': { title: 'Task List — All Tasks | TaskTimer', description: 'Browse, filter and manage all your tracked tasks and earnings.', keywords: 'task list, history, earnings' },
            '/payout': { title: 'Payout — Withdraw Earnings | TaskTimer', description: 'Request payout for your tracked earnings via bKash, Nagad, Rocket or bank.', keywords: 'payout, withdraw, earnings' },
            '/auth': { title: 'Sign In — TaskTimer', description: 'Sign in or create account to start tracking tasks with TaskTimer.', keywords: 'login, sign up, auth' },
            '/admin': { title: 'Admin Panel — TaskTimer', description: 'Admin overview for users, tasks and payouts.', keywords: 'admin, management' },
        };
        for (const [route, v] of Object.entries(pages)) {
            await sql`INSERT INTO seo_pages (route, title, description, keywords, og_image, canonical, robots_index, robots_follow) VALUES (${route}, ${v.title}, ${v.description}, ${v.keywords}, ${'/tasktimer-logo.svg'}, ${route}, ${route === '/admin' ? false : true}, true) ON CONFLICT (route) DO NOTHING`;
        }
    }

    await sql`CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        author TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        image TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL DEFAULT (CURRENT_DATE::text),
        read_time TEXT NOT NULL DEFAULT '3 min',
        seo_title TEXT NOT NULL DEFAULT '',
        seo_description TEXT NOT NULL DEFAULT '',
        seo_keywords TEXT NOT NULL DEFAULT '',
        og_image TEXT NOT NULL DEFAULT '/tasktimer-logo.svg',
        canonical TEXT NOT NULL DEFAULT '',
        robots_index BOOLEAN DEFAULT true,
        robots_follow BOOLEAN DEFAULT true,
        published BOOLEAN DEFAULT true,
        created_at TEXT DEFAULT (now()::text),
        updated_at TEXT DEFAULT (now()::text)
    )`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_title TEXT DEFAULT ''`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT ''`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_keywords TEXT DEFAULT ''`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image TEXT DEFAULT '/tasktimer-logo.svg'`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical TEXT DEFAULT ''`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS robots_index BOOLEAN DEFAULT true`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS robots_follow BOOLEAN DEFAULT true`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS focus_keyword TEXT DEFAULT ''`;
    await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0`;
    await sql`DELETE FROM blog_posts WHERE image NOT LIKE 'http%' AND image != ''`;
}
