import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import useTour from '@/composables/useTour';
import { useSettingsStore } from '@/stores/settingsStore';

const { Tour } = vi.hoisted(() => ({
  Tour: vi.fn(function () {
    this.steps = [];
    this.handlers = {};
    this.addStep = (step) => this.steps.push(step);
    this.on = (name, handler) => {
      this.handlers[name] = handler;
    };
    this.start = vi.fn();
    this.cancel = vi.fn(() => this.handlers.cancel?.());
    this.complete = vi.fn(() => this.handlers.complete?.());
    this.next = vi.fn();
    this.back = vi.fn();
  }),
}));
vi.mock('shepherd.js', () => ({ default: { Tour } }));
describe('On-demand tour', () => {
  beforeEach(() => {
    Tour.mockClear();
    localStorage.clear();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });
  it('only creates the tour when requested', async () => {
    const wrapper = mount(
      { setup: useTour, template: '<div />' },
      { global: { plugins: [createPinia()] } },
    );
    expect(Tour).not.toHaveBeenCalled();
    await wrapper.vm.startTour();
    expect(Tour).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.tour.start).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
  it('includes only steps whose page targets exist and refreshes them after navigation', async () => {
    document.body.innerHTML =
      '<div class="v-tabs"></div><input id="scoring-variant-input"><input id="inheritance-pattern-select"><input id="segregation-probability-input"><form class="scoring-search-card"><button type="submit"></button></form><div class="combined-score-card"></div><div class="gene-card"></div><div class="variant-card"></div><div class="inheritance-card"></div>';
    const wrapper = mount(
      { setup: useTour, template: '<div />' },
      { global: { plugins: [createPinia()] } },
    );
    await wrapper.vm.startTour();
    expect(wrapper.vm.tour.steps.map((step) => step.id)).toEqual(
      expect.arrayContaining([
        'search-tabs',
        'variant-input',
        'inheritance-pattern',
        'segregation-probability',
        'search-button',
        'combined-score',
        'gene-card',
        'variant-card',
        'inheritance-card',
      ]),
    );
    document.body.innerHTML = '';
    await wrapper.vm.startTour();
    expect(wrapper.vm.tour.steps.map((step) => step.id)).not.toContain(
      'variant-input',
    );
    expect(wrapper.vm.tour.steps.map((step) => step.id)).not.toContain(
      'combined-score',
    );
    expect(Tour).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
  it('persists cancellation and completion and allows an explicit restart', async () => {
    const pinia = createPinia();
    const wrapper = mount(
      { setup: useTour, template: '<div />' },
      { global: { plugins: [pinia] } },
    );
    const settings = useSettingsStore(pinia);
    expect(wrapper.vm.shouldShowTour()).toBe(true);
    wrapper.vm.cancelTour();
    wrapper.vm.completeTour();
    expect(settings.tourStatus).toBe('new');
    await wrapper.vm.startTour();
    expect(wrapper.vm.isTourActive).toBe(true);
    wrapper.vm.cancelTour();
    expect(settings.tourStatus).toBe('skipped');
    expect(wrapper.vm.isTourActive).toBe(false);
    expect(wrapper.vm.shouldShowTour()).toBe(false);
    await wrapper.vm.startTour();
    wrapper.vm.completeTour();
    expect(settings.tourStatus).toBe('completed');
    wrapper.vm.restartTour();
    await flushPromises();
    expect(settings.tourStatus).toBe('new');
    expect(wrapper.vm.isTourActive).toBe(true);
    wrapper.unmount();
    expect(settings.tourStatus).toBe('skipped');
  });
  it('does not create an overlay when its host unmounts while lazy initialization is pending', async () => {
    const wrapper = mount(
      { setup: useTour, template: '<div />' },
      { global: { plugins: [createPinia()] } },
    );
    const started = wrapper.vm.startTour();
    wrapper.unmount();
    await started;
    expect(Tour).not.toHaveBeenCalled();
  });
});
