// Shared slug helper — Unicode-aware so Bangla (and any language)
// titles produce a readable permalink instead of an empty slug.
// Safe to import from client components (no server dependencies).

export function slugify(t: string): string {
    return String(t || '')
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
