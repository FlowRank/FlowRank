/** Canonical API prefix; trims trailing slashes so callers append segments like `/links/`. */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");
