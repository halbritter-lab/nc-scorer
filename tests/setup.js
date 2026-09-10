// tests/setup.js
import { vi, beforeEach } from 'vitest';

// Polyfill ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverMock;
window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

// Polyfill IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = global.IntersectionObserver || IntersectionObserverMock;
window.IntersectionObserver = window.IntersectionObserver || IntersectionObserverMock;

// Polyfill window.matchMedia
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Polyfill URL.createObjectURL and revokeObjectURL
window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
window.URL.revokeObjectURL = vi.fn();
if (typeof URL !== 'undefined') {
  URL.createObjectURL = window.URL.createObjectURL;
  URL.revokeObjectURL = window.URL.revokeObjectURL;
}

// Polyfill window.scrollTo
if (!window.scrollTo) {
  window.scrollTo = vi.fn();
}

// In-memory Storage Mock
function createStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i) => Object.keys(store)[i] || null),
  };
}

const mockSessionStorage = createStorageMock();
const mockLocalStorage = createStorageMock();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

beforeEach(() => {
  mockSessionStorage.clear();
  mockLocalStorage.clear();
  vi.clearAllMocks();
});
