/* global document */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

const bootstrap = vi.hoisted(() => ({
  readiness: null,
  resolveReady: null,
  rejectReady: null,
  app: null,
}));

vi.mock('@/router', async () => {
  const { createMemoryHistory, createRouter } = await import('vue-router');
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      {
        path: '/symbols/:symbol',
        name: 'GeneView',
        component: { template: '<div />' },
      },
    ],
  });
  router.isReady = () => bootstrap.readiness;
  return { default: router };
});

vi.mock('@/App.vue', async () => {
  const { getCurrentInstance, h } = await import('vue');
  const { defineStore } = await import('pinia');
  const { useTheme } = await import('vuetify');
  const { useRouter } = await import('vue-router');
  const { useHead } = await import('@unhead/vue');
  const { useUiStore } = await import('@/stores/uiStore');
  const useCounter = defineStore('bootstrap-counter', {
    state: () => ({ count: 0 }),
  });
  return {
    default: {
      setup() {
        bootstrap.app = getCurrentInstance().appContext.app;
        const counter = useCounter();
        const theme = useTheme();
        const router = useRouter();
        const uiStore = useUiStore();
        useHead({ title: 'Bootstrapped NC-Scorer' });
        return () =>
          h('main', { 'data-primary': theme.current.value.colors.primary }, [
            uiStore.notification.visible
              ? h('p', { role: 'alert' }, uiStore.notification.message)
              : null,
            h(
              'a',
              {
                href: router.resolve({
                  name: 'GeneView',
                  params: { symbol: 'PKD1' },
                }).href,
              },
              'Gene details',
            ),
            h(
              'button',
              {
                onClick: () => {
                  counter.count += 1;
                },
              },
              `Count ${counter.count}`,
            ),
          ]);
      },
    },
  };
});

let observers;

beforeEach(() => {
  vi.resetModules();
  bootstrap.app = null;
  bootstrap.readiness = new Promise((resolve, reject) => {
    bootstrap.resolveReady = resolve;
    bootstrap.rejectReady = reject;
  });
  document.body.innerHTML = '<div id="app"></div>';
  document.title = '';
  observers = [];
  vi.stubGlobal(
    'PerformanceObserver',
    class {
      constructor(callback) {
        this.callback = callback;
        observers.push(this);
      }
      observe(options) {
        this.options = options;
      }
    },
  );
});

afterEach(() => {
  bootstrap.app?.unmount();
  document.body.innerHTML = '';
  document.head
    .querySelectorAll('[id^="vuetify"]')
    .forEach((node) => node.remove());
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

// This suite loads the real application plugins after each module reset.
// Coverage instrumentation can exceed the default timeout on a busy CI worker.
describe('application bootstrap', { timeout: 20000 }, () => {
  it('mounts a usable shell and shows recovery guidance when the initial route fails', async () => {
    vi.stubEnv('DEV', false);
    await import('@/main.js');
    bootstrap.rejectReady(
      new Error('Failed to fetch dynamically imported module'),
    );
    await flushPromises();

    expect(document.querySelector('main')).not.toBeNull();
    expect(document.querySelector('[role="alert"]').textContent).toBe(
      'This page could not load. Refresh the page or choose another page from the navigation.',
    );
    expect(document.querySelector('a').getAttribute('href')).toBe(
      '/symbols/PKD1',
    );
    document.querySelector('button').click();
    await flushPromises();
    expect(document.querySelector('button').textContent).toBe('Count 1');
  });

  it('waits for the initial route before mounting and installs working application plugins', async () => {
    vi.stubEnv('DEV', false);
    await import('@/main.js');
    await flushPromises();
    expect(document.querySelector('#app').children).toHaveLength(0);
    expect(bootstrap.app).toBeNull();

    bootstrap.resolveReady();
    await flushPromises();
    expect(document.querySelector('main').dataset.primary).toBe('#a0ddd0');
    expect(document.querySelector('a').getAttribute('href')).toBe(
      '/symbols/PKD1',
    );
    document.querySelector('button').click();
    await flushPromises();
    expect(document.querySelector('button').textContent).toBe('Count 1');
    await vi.waitFor(() =>
      expect(document.title).toBe('Bootstrapped NC-Scorer'),
    );
    expect(observers).toEqual([]);
  });

  it('records development LCP and input-delay observations without requiring the route to mount', async () => {
    vi.stubEnv('DEV', true);
    await import('@/main.js');
    expect(document.querySelector('main')).toBeNull();
    const { logService } = await import('@/services/logService');
    logService.entries.value.splice(0);

    const lcp = observers.find(
      (observer) => observer.options.type === 'largest-contentful-paint',
    );
    const fid = observers.find(
      (observer) => observer.options.type === 'first-input',
    );
    expect(lcp.options.buffered).toBe(true);
    expect(fid.options.buffered).toBe(true);
    lcp.callback({ getEntries: () => [] });
    fid.callback({ getEntries: () => [] });
    expect(logService.entries.value).toEqual([]);

    lcp.callback({
      getEntries: () => [
        { startTime: 120, element: { tagName: 'H1' } },
        { startTime: 150 },
        { startTime: 180, element: {} },
      ],
    });
    fid.callback({
      getEntries: () => [{ startTime: 200, processingStart: 206.7 }],
    });
    expect(
      logService.entries.value.map((entry) => entry.displayMessage),
    ).toEqual([
      'LCP: 120ms - H1',
      'LCP: 150ms - unknown element',
      'LCP: 180ms - unknown element',
      'FID: 7ms',
    ]);

    bootstrap.resolveReady();
    await flushPromises();
    expect(document.querySelector('main')).not.toBeNull();
  });
});
