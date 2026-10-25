/**
 * FavoritesService — local-first CRUD for home page favorites and quick links.
 * All data lives in localStorage under two keys. No backend required.
 * The interface is designed for a future migration to a REST API.
 */

const FAVORITES_KEY = "mtd_home_favorites";
const LINKS_KEY = "mtd_home_links";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FavoriteItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
  addedAt: number;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  addedAt: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export const FavoritesService = {
  getFavorites(): FavoriteItem[] {
    return load<FavoriteItem>(FAVORITES_KEY, []);
  },

  addFavorite(item: Omit<FavoriteItem, "id" | "addedAt">): FavoriteItem {
    const all = this.getFavorites();
    const entry: FavoriteItem = { ...item, id: uid(), addedAt: Date.now() };
    save(FAVORITES_KEY, [...all, entry]);
    return entry;
  },

  removeFavorite(id: string): void {
    save(FAVORITES_KEY, this.getFavorites().filter((f) => f.id !== id));
  },

  // ---------------------------------------------------------------------------
  // Quick links
  // ---------------------------------------------------------------------------

  getLinks(): LinkItem[] {
    return load<LinkItem>(LINKS_KEY, []);
  },

  addLink(item: Omit<LinkItem, "id" | "addedAt">): LinkItem {
    const all = this.getLinks();
    const entry: LinkItem = { ...item, id: uid(), addedAt: Date.now() };
    save(LINKS_KEY, [...all, entry]);
    return entry;
  },

  removeLink(id: string): void {
    save(LINKS_KEY, this.getLinks().filter((l) => l.id !== id));
  },
};
