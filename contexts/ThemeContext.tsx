'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeSettings, DEFAULT_THEME, themeToCssVars } from '@/lib/theme';

const STORAGE_KEY = 'tasktimer_theme';

type Ctx = { theme: ThemeSettings; setTheme: (t: ThemeSettings) => void; update: (p: Partial<ThemeSettings>) => void; reset: () => void; };

const ThemeContext = createContext<Ctx>({ theme: DEFAULT_THEME, setTheme: () => {}, update: () => {}, reset: () => {} });

function applyVars(t: ThemeSettings) {
  const vars = themeToCssVars(t);
  const root = document.documentElement;
  for (const [k,v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.style.setProperty('--gray-100', t.background);
  root.style.setProperty('--surface', t.surface);
  root.dataset.theme = t.mode === 'dark' ? 'dark' : 'light';
  if (t.mode === 'auto') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'dark' : 'light';
  }
  document.body.style.fontFamily = `var(--font-inter), ${t.font_family}, sans-serif`;
  document.body.style.background = t.background;
  root.style.setProperty('--density', t.density);
}

export function ThemeProvider({ children, serverTheme }: { children: ReactNode; serverTheme?: ThemeSettings }) {
  const [theme, setThemeState] = useState<ThemeSettings>(serverTheme || DEFAULT_THEME);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const parsed = JSON.parse(raw); setThemeState(p => ({ ...p, ...parsed })); }
      else {
        fetch('/api/theme').then(r=>r.json()).then(d=> setThemeState(p=> ({ ...p, ...d }))).catch(()=>{});
      }
    } catch {}
  }, []);

  useEffect(() => { applyVars(theme); localStorage.setItem(STORAGE_KEY, JSON.stringify(theme)); }, [theme]);

  useEffect(() => {
    if (theme.mode !== 'auto') return;
    const m = window.matchMedia('(prefers-color-scheme: dark)');
    const h = () => applyVars(theme);
    m.addEventListener('change', h); return () => m.removeEventListener('change', h);
  }, [theme]);

  const setTheme = (t: ThemeSettings) => setThemeState(t);
  const update = (p: Partial<ThemeSettings>) => setThemeState(s => ({ ...s, ...p }));
  const reset = () => setThemeState(DEFAULT_THEME);

  return <ThemeContext.Provider value={{ theme, setTheme, update, reset }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
