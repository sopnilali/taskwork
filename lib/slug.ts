// Shared slug helper — Unicode-aware so Bangla (and any language)
// titles produce a readable permalink instead of an empty slug.
// Safe to import from client components (no server dependencies).

export function slugify(t: string): string {
    return String(t || '')
        .normalize('NFC')
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

// Guarantees a non-empty slug for permalinks like /blog/<slug>.
export function slugifyWithFallback(t: string): string {
    return slugify(t) || `post-${Date.now().toString(36)}`;
}

// Normalizes an incoming slug from URL params: percent-encoded,
// decoded, NFC or NFD forms all map to the stored NFC slug.
export function normalizeSlug(s: string): string {
    let v = String(s || '');
    try {
        if (v.includes('%')) v = decodeURIComponent(v);
    } catch { /* keep raw */ }
    return v.normalize('NFC');
}
