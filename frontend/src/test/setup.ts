import '@testing-library/jest-dom';

// JSDOM canvas getContext polyfill
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}

if (typeof window !== 'undefined') {
  window.scrollTo = () => {};

  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
}

// JSDOM IntersectionObserver polyfill
if (typeof global !== 'undefined' && !global.IntersectionObserver) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  if (typeof window !== 'undefined') {
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }
}
