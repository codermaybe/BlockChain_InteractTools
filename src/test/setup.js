import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  writable: true,
  value: globalThis.ResizeObserver || ResizeObserverMock,
});
