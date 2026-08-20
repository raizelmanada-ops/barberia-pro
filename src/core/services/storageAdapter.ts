// ==========================================================================
// BARBERIA_PRO - Storage Adapter
// Decoupled Storage Layer (Local Persistence with in-memory fallback)
// Future-proof for Supabase / PostgreSQL / REST API backend
// ==========================================================================

export class StorageAdapter {
  private static isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  static get<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;
    try {
      const item = localStorage.getItem(`barberiapro_${key}`);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to read key: ${key}`, e);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;
    try {
      localStorage.setItem(`barberiapro_${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to write key: ${key}`, e);
      return false;
    }
  }

  static remove(key: string): boolean {
    if (!this.isAvailable()) return false;
    try {
      localStorage.removeItem(`barberiapro_${key}`);
      return true;
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to remove key: ${key}`, e);
      return false;
    }
  }
}
