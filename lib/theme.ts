import { sql } from '@/lib/db';

export type ThemeSettings = {
  preset: string;
  mode: 'light' | 'dark' | 'auto';
  primary: string;
  primary_hover: string;
  primary_light: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  surface: string;
  text: string;
  radius: string;
  radius_lg: string;
  font_family: string;
  density: 'compact' | 'comfortable' | 'spacious';
  shadows: 'none' | 'soft' | 'strong';
  gradient: boolean;
};

export const THEME_PRESETS: Record<string, Partial<ThemeSettings>> = {
  indigo: { primary: '#6366f1', primary_hover: '#4f46e5', primary_light: '#e0e7ff' },
  emerald: { primary: '#10b981', primary_hover: '#059669', primary_light: '#d1fae5' },
  rose: { primary: '#f43f5e', primary_hover: '#e11d48', primary_light: '#ffe4e6' },
  sky: { primary: '#0ea5e9', primary_hover: '#0284c7', primary_light: '#e0f2fe' },
  amber: { primary: '#f59e0b', primary_hover: '#d97706', primary_light: '#fef3c7' },
  violet: { primary: '#8b5cf6', primary_hover: '#7c3aed', primary_light: '#ede9fe' },
};

export const DEFAULT_THEME: ThemeSettings = {
  preset: 'indigo',
  mode: 'light',
  primary: '#6366f1',
  primary_hover: '#4f46e5',
  primary_light: '#e0e7ff',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  background: '#f3f4f6',
  surface: '#ffffff',
  text: '#1f2937',
  radius: '12px',
  radius_lg: '16px',
  font_family: 'Inter',
  density: 'comfortable',
  shadows: 'soft',
  gradient: true,
};

export async function getThemeSettings(): Promise<ThemeSettings> {
  try {
    const rows = await sql`SELECT key, value FROM theme_settings`;
    if (!rows.length) return DEFAULT_THEME;
    const m: Record<string, string> = {};
    for (const r of rows) m[r.key] = r.value;
    return {
      preset: m.preset || DEFAULT_THEME.preset,
      mode: (m.mode as ThemeSettings['mode']) || DEFAULT_THEME.mode,
      primary: m.primary || DEFAULT_THEME.primary,
      primary_hover: m.primary_hover || DEFAULT_THEME.primary_hover,
      primary_light: m.primary_light || DEFAULT_THEME.primary_light,
      success: m.success || DEFAULT_THEME.success,
      warning: m.warning || DEFAULT_THEME.warning,
      danger: m.danger || DEFAULT_THEME.danger,
      info: m.info || DEFAULT_THEME.info,
      background: m.background || DEFAULT_THEME.background,
      surface: m.surface || DEFAULT_THEME.surface,
      text: m.text || DEFAULT_THEME.text,
      radius: m.radius || DEFAULT_THEME.radius,
      radius_lg: m.radius_lg || DEFAULT_THEME.radius_lg,
      font_family: m.font_family || DEFAULT_THEME.font_family,
      density: (m.density as ThemeSettings['density']) || DEFAULT_THEME.density,
      shadows: (m.shadows as ThemeSettings['shadows']) || DEFAULT_THEME.shadows,
      gradient: m.gradient ? m.gradient === 'true' : DEFAULT_THEME.gradient,
    };
  } catch { return DEFAULT_THEME; }
}

export async function saveThemeSettings(data: Partial<ThemeSettings>) {
  for (const [k, v] of Object.entries(data)) {
    await sql`INSERT INTO theme_settings (key, value) VALUES (${k}, ${String(v)}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  }
}

export function themeToCssVars(t: ThemeSettings): Record<string, string> {
  return {
    '--primary': t.primary,
    '--primary-hover': t.primary_hover,
    '--primary-light': t.primary_light,
    '--success': t.success,
    '--warning': t.warning,
    '--danger': t.danger,
    '--info': t.info,
    '--gray-100': t.background,
    '--radius': t.radius,
    '--radius-lg': t.radius_lg,
  };
}
