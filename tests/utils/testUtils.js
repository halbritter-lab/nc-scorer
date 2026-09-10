// tests/utils/testUtils.js
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createPinia, setActivePinia } from 'pinia';

export function createTestVuetify() {
  return createVuetify({
    components,
    directives,
  });
}

export function mountWithPlugins(component, options = {}) {
  const vuetify = options.vuetify || createTestVuetify();
  const pinia = options.pinia || createPinia();
  setActivePinia(pinia);

  const { global = {}, ...restOptions } = options;

  return mount(component, {
    global: {
      ...global,
      plugins: [
        vuetify,
        pinia,
        ...(global.plugins || []),
      ],
      stubs: {
        ...(global.stubs || {}),
      },
      mocks: {
        ...(global.mocks || {}),
      },
    },
    ...restOptions,
  });
}
