import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import { flushPromises } from '@vue/test-utils';
import VariantView from '@/views/VariantView.vue';
import { mountWithPlugins } from '../../utils/testUtils.js';

describe('Variant details assembly', () => {
  it('defaults the real router omitted assembly segment and rejects an unsupported segment', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/variant/:variantInput/:assembly?',
          component: VariantView,
          props: true,
        },
      ],
    });
    await router.push('/variant/1-55051215-G-GA');
    await router.isReady();
    const wrapper = mountWithPlugins(
      { render: () => h(RouterView) },
      {
        global: { plugins: [router], stubs: { VariantCard: true } },
      },
    );
    expect(router.currentRoute.value.params.assembly).toBe('');
    expect(
      wrapper.findComponent({ name: 'VariantCard' }).props('assembly'),
    ).toBe('GRCh38');
    await router.push('/variant/1-55051215-G-GA/GRCh36');
    await flushPromises();
    expect(wrapper.text()).toContain('Unsupported genome assembly');
    expect(wrapper.findComponent({ name: 'VariantCard' }).exists()).toBe(false);
    wrapper.unmount();
  });

  const mountView = (props = {}) =>
    mountWithPlugins(VariantView, {
      props: { variantInput: '1-100-A-G', ...props },
      global: { stubs: { VariantCard: true } },
    });

  it.each([
    [undefined, 'GRCh38'],
    [' grch37 ', 'GRCh37'],
  ])('passes canonical assembly %s to annotation', (assembly, expected) => {
    const wrapper = mountView({ assembly });
    expect(
      wrapper.findComponent({ name: 'VariantCard' }).props('assembly'),
    ).toBe(expected);
    wrapper.unmount();
  });

  it('blocks unsupported assembly until the route is corrected', async () => {
    const wrapper = mountView({ assembly: 'GRCh36' });
    expect(wrapper.text()).toContain('Unsupported genome assembly');
    expect(wrapper.findComponent({ name: 'VariantCard' }).exists()).toBe(false);
    await wrapper.setProps({ assembly: 'GRCh37' });
    expect(
      wrapper.findComponent({ name: 'VariantCard' }).props('assembly'),
    ).toBe('GRCh37');
    wrapper.unmount();
  });
});
