import '@testing-library/jest-dom/vitest';

const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem(key: string) {
            return Object.prototype.hasOwnProperty.call(store, key)
                ? store[key]
                : null;
        },
        setItem(key: string, value: string) {
            store[key] = String(value);
        },
        removeItem(key: string) {
            delete store[key];
        },
        clear() {
            store = {};
        },
        key(index: number) {
            return Object.keys(store)[index] ?? null;
        },
        get length() {
            return Object.keys(store).length;
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
    }),
});

// Mock IntersectionObserver for framer-motion in jsdom test environment
class MockIntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
});
