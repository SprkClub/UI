// Advanced caching system with Redis-like functionality using Node.js Map
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class SuperFastCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum cache entries
  private defaultTTL = 60000; // 1 minute default

  // Get cached data with automatic cleanup
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit counter
    entry.hits++;
    return entry.data;
  }

  // Set cache data with TTL
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    });
  }

  // Delete specific key
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Cleanup expired entries and least used entries
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });

    // If still too many entries, remove least used
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].hits - b[1].hits);

      const toRemove = sortedEntries.slice(0, Math.floor(this.maxSize * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let total = 0;
    let totalHits = 0;

    this.cache.forEach(entry => {
      total++;
      totalHits += entry.hits;
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
    });

    return {
      total,
      expired,
      active: total - expired,
      totalHits,
      hitRate: total > 0 ? (totalHits / total).toFixed(2) : '0'
    };
  }
}

// Global cache instances
export const apiCache = new SuperFastCache();
export const dbCache = new SuperFastCache();
export const userCache = new SuperFastCache();

// Cache key generators
export const cacheKeys = {
  tokens: (wallet?: string, limit: number = 20, offset: number = 0) =>
    `tokens:${wallet || 'all'}:${limit}:${offset}`,

  referral: (username: string) => `referral:${username}`,

  user: (username: string) => `user:${username}`,

  health: () => 'health:status',

  featured: (limit: number = 10) => `featured:${limit}`,
};

// Utility functions for common caching patterns
export function getCachedOrFetch<T>(
  cacheInstance: SuperFastCache,
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try cache first
      const cached = cacheInstance.get<T>(key);
      if (cached) {
        resolve(cached);
        return;
      }

      // Fetch fresh data
      const freshData = await fetchFn();
      cacheInstance.set(key, freshData, ttl);
      resolve(freshData);
    } catch (error) {
      reject(error);
    }
  });
}

// Background cache warming
export function warmCache(keys: string[], fetchFns: (() => Promise<any>)[]): void {
  keys.forEach(async (key, index) => {
    try {
      if (fetchFns[index]) {
        const data = await fetchFns[index]();
        apiCache.set(key, data, 120000); // 2 minute cache
      }
    } catch (error) {
      console.error(`Cache warming failed for ${key}:`, error);
    }
  });
}