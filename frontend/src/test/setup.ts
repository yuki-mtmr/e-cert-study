import '@testing-library/jest-dom';

// Node.js 22+ のビルトイン localStorage は clear()/length/key() を持たないため、
// Web Storage API 互換のモックで上書きする
if (typeof localStorage !== 'undefined' && typeof localStorage.clear !== 'function') {
  const store = new Map<string, string>();
  const storageMock: Storage = {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key: string) { return store.get(key) ?? null; },
    key(index: number) { return [...store.keys()][index] ?? null; },
    removeItem(key: string) { store.delete(key); },
    setItem(key: string, value: string) { store.set(key, String(value)); },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: storageMock,
    writable: true,
    configurable: true,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  }
}
