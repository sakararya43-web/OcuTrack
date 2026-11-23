import '@testing-library/jest-dom';

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    if (options?.root) this.root = options.root;
    if (options?.rootMargin) this.rootMargin = options.rootMargin;
    if (options?.threshold) {
      this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold];
    }
  }

  observe = (target: Element) => {
    this.callback(
      [
        {
          isIntersecting: true,
          target,
          intersectionRatio: 1,
          boundingClientRect: target.getBoundingClientRect ? target.getBoundingClientRect() : ({} as DOMRectReadOnly),
          intersectionRect: target.getBoundingClientRect ? target.getBoundingClientRect() : ({} as DOMRectReadOnly),
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ],
      this
    );
  };
  unobserve = () => {};
  disconnect = () => {};
  takeRecords = () => [];
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

class MockResizeObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: mockMatchMedia,
});

Object.defineProperty(global, 'matchMedia', {
  writable: true,
  configurable: true,
  value: mockMatchMedia,
});


