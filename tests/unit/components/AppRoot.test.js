import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createHead } from '@unhead/vue/client';
import App from '@/App.vue';
import SearchPage from '@/views/SearchPage.vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import { iconConfig } from '@/config/iconConfig';

vi.mock('@/api/geneApi', () => ({
  fetchGeneSearchIndices: async () => ({
    combinedItems: [],
    symbolsIndex: [],
    hgncIndex: [],
    hgncToSymbolMap: {},
  }),
}));
const wrappers = [];
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  document.body.innerHTML = '';
});

async function render(acknowledged = false) {
  const pinia = createPinia();
  const settings = useSettingsStore(pinia);
  if (acknowledged) settings.acknowledgeDisclaimer();
  const placeholder = { template: '<div />' };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: SearchPage },
      {
        path: '/scoring/:variantInput',
        name: 'ScoringView',
        component: placeholder,
      },
      {
        path: '/variant/:variantInput/:assembly?',
        name: 'VariantView',
        component: placeholder,
      },
      { path: '/gene/:symbol', name: 'GeneView', component: placeholder },
      { path: '/:pathMatch(.*)*', component: placeholder },
    ],
  });
  await router.push('/');
  const wrapper = mount(App, {
    attachTo: document.body,
    global: {
      plugins: [
        pinia,
        router,
        createHead(),
        createVuetify({ components, directives, icons: iconConfig }),
      ],
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return { wrapper, settings, ui: useUiStore(pinia) };
}

describe('application startup and search navigation', () => {
  it('requires first-visit acknowledgment and exposes a keyboard skip target', async () => {
    const { wrapper, settings } = await render();
    expect(wrapper.find('.skip-link').attributes('href')).toBe('#main-content');
    expect(wrapper.find('#main-content').attributes('tabindex')).toBe('-1');
    expect(wrapper.vm.isDisclaimerAcknowledged).toBe(false);
    [...document.querySelectorAll('button')]
      .find((button) => button.textContent.includes('I Understand'))
      .click();
    await flushPromises();
    expect(wrapper.vm.isDisclaimerAcknowledged).toBe(true);
    expect(settings.isDisclaimerAcknowledged).toBe(true);
  });
  it('switches between scoring, variant, and gene forms and opens logs on demand', async () => {
    const { wrapper, ui } = await render(true);
    expect(wrapper.find('form.scoring-search-card').exists()).toBe(true);
    expect(wrapper.vm.isDisclaimerAcknowledged).toBe(true);
    const tabs = wrapper.findAll('[role="tab"]');
    await tabs.find((tab) => tab.text() === 'Variant details').trigger('click');
    await vi.waitFor(() =>
      expect(wrapper.find('form.variant-search-card').exists()).toBe(true),
    );
    await tabs.find((tab) => tab.text() === 'Find a gene').trigger('click');
    await vi.waitFor(() =>
      expect(wrapper.find('form.gene-search-form').exists()).toBe(true),
    );
    expect(wrapper.find('a[href="/batch"]').exists()).toBe(true);
    ui.openLogViewer();
    await flushPromises();
    expect(wrapper.vm.showLogViewer).toBe(true);
    wrapper.vm.closeLogViewer();
    await flushPromises();
    expect(ui.showLogViewer).toBe(false);
  });
});
