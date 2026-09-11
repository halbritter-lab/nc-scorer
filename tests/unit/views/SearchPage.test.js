import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import SearchPage from '@/views/SearchPage.vue';
import { mountWithPlugins } from '../../utils/testUtils.js';

vi.mock('@/components/ScoringSearch.vue', () => ({
  default: { template: '<div />' },
}));
vi.mock('@/components/GeneSearch.vue', () => ({
  default: { template: '<div />' },
}));
vi.mock('@/components/VariantSearch.vue', () => ({
  default: { template: '<div />' },
}));
vi.mock('@/components/PreprintBanner.vue', () => ({
  default: { template: '<div />' },
}));

let observers;
let wrapper;
beforeEach(() => {
  observers = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback) {
        this.callback = callback;
        this.observe = vi.fn();
        this.unobserve = vi.fn();
        this.disconnect = vi.fn();
        observers.push(this);
      }
    },
  );
});
afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function render() {
  wrapper = mountWithPlugins(SearchPage, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  });
  const panel = wrapper.find('.search-panel').element;
  const bounds = { width: 1000, height: 480 };
  vi.spyOn(panel, 'getBoundingClientRect').mockImplementation(() => ({
    ...bounds,
  }));
  const observer = observers.find((item) =>
    item.observe.mock.calls.some(([target]) => target === panel),
  );
  observer?.callback();
  const select = (tab) =>
    wrapper.findComponent({ name: 'VTabs' }).vm.$emit('update:modelValue', tab);
  return { panel, bounds, observer, select };
}

describe('search panel size reservation', () => {
  it('captures the visible height before the old tab disappears and retains the largest panel', async () => {
    const { panel, bounds, select } = render();
    select('variant');
    bounds.height = 0;
    await nextTick();
    expect(panel.style.minHeight).toBe('480px');

    bounds.height = 720;
    select('gene');
    await nextTick();
    expect(panel.style.minHeight).toBe('720px');

    bounds.height = 220;
    select('scoring');
    await nextTick();
    expect(panel.style.minHeight).toBe('720px');
  });

  it.each([390, 1440])(
    'releases the reservation after resizing to %s px and measures the new layout',
    async (width) => {
      const { panel, bounds, observer, select } = render();
      select('variant');
      await nextTick();
      expect(panel.style.minHeight).toBe('480px');
      expect(observer).toBeDefined();

      bounds.height = 600;
      observer.callback();
      await nextTick();
      expect(panel.style.minHeight).toBe('480px');

      bounds.width = width;
      observer.callback();
      await nextTick();
      expect(panel.style.minHeight).toBe('0px');
      bounds.height = 260;
      select('gene');
      await nextTick();
      expect(panel.style.minHeight).toBe('260px');

      wrapper.unmount();
      wrapper = null;
      expect(observer.disconnect).toHaveBeenCalledOnce();
    },
  );
});
