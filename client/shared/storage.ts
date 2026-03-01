/**
 * Abstraction over key-value storage (e.g. localStorage).
 * Use for dependency injection and testability — pass an
 * in-memory fake in tests instead of mocking globals.
 */
export interface StorageService {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Production adapter wrapping `window.localStorage`.
 * All calls are wrapped in try/catch so the app degrades
 * gracefully when storage is unavailable (e.g. Safari
 * private mode quota exceeded).
 */
export class LocalStorageAdapter implements StorageService {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable — silent fallback */
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable — silent fallback */
    }
  }
}

/**
 * In-memory storage for testing. Each instance is isolated
 * — no cross-test contamination, no global mocking required.
 */
export class InMemoryStorage implements StorageService {
  private data: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.data[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }
}
