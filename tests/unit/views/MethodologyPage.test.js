import { afterEach, describe, expect, it } from 'vitest';
import { mountWithPlugins } from '../../utils/testUtils.js';
import { createMemoryHistory, createRouter } from 'vue-router';
import MethodologyPage from '@/views/MethodologyPage.vue';

let wrapper;
afterEach(() => wrapper?.unmount());

async function render() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  });
  await router.push('/');
  wrapper = mountWithPlugins(MethodologyPage, {
    global: { plugins: [router] },
  });
  return wrapper;
}

describe('methodology reading page', () => {
  it('uses the shared page geometry and a flat, accessible section hierarchy', async () => {
    await render();
    expect(wrapper.find('.content-container.methodology-page').exists()).toBe(
      true,
    );
    expect(wrapper.findAll('h1')).toHaveLength(1);
    expect(wrapper.find('.page-header .page-title').text()).toBe(
      'NC-Scorer Methodology',
    );
    expect(wrapper.findAll('.v-card')).toHaveLength(0);
    expect(wrapper.find('.page-header a').attributes('href')).toBe('/');
    for (const section of wrapper.findAll('section[aria-labelledby]')) {
      expect(
        wrapper.find(`#${section.attributes('aria-labelledby')}`).element
          .tagName,
      ).toBe('H2');
    }
  });

  it('states the 4/4/2 formula and explains all three evidence inputs', async () => {
    await render();
    expect(wrapper.find('.score-equation').exists()).toBe(true);
    expect(wrapper.find('.score-equation').text().replace(/\s+/g, ' ')).toBe(
      'NCS = (Gene score × 4) + (Variant score × 4) + (Inheritance score × 2)',
    );
    expect(
      wrapper.findAll('.component-list dt').map((item) => item.text()),
    ).toEqual(['Gene score × 4', 'Variant score × 4', 'Inheritance score × 2']);
    expect(wrapper.text()).toContain('Each component is scored from 0 to 1');
    expect(wrapper.text()).toContain(
      'Gene expression patterns in kidney tissue',
    );
    expect(wrapper.text()).toContain('Known associations with kidney diseases');
    expect(wrapper.text()).toContain(
      'Variant characteristics and predicted functional impact',
    );
    expect(wrapper.text()).toContain(
      'Inheritance patterns observed in kidney disorders',
    );
  });

  it('defines non-overlapping prioritization tiers with accessible table headers', async () => {
    await render();
    expect(wrapper.find('table caption').exists()).toBe(true);
    expect(wrapper.find('table caption').text()).toBe(
      'Nephro Candidate Score priority tiers',
    );
    expect(
      wrapper.findAll('thead th[scope="col"]').map((item) => item.text()),
    ).toEqual(['NCS range', 'Priority']);
    expect(
      wrapper
        .findAll('tbody tr')
        .map((row) => row.findAll('th, td').map((cell) => cell.text())),
    ).toEqual([
      ['0 ≤ NCS < 3', 'Low priority'],
      ['3 ≤ NCS < 7', 'Moderate priority'],
      ['7 ≤ NCS ≤ 10', 'High priority'],
    ]);
  });

  it('limits the missing-segregation penalty to inheritance and preserves valid zero input', async () => {
    await render();
    expect(wrapper.find('#segregation-section').exists()).toBe(true);
    const explanation = wrapper.find('#segregation-section').text();
    expect(explanation).toContain('multiplied by 0.8 (a 20% reduction)');
    expect(explanation).toContain('only to the inheritance component');
    expect(explanation).toContain('before its × 2 contribution is added');
    expect(explanation).toContain('Zero is a valid segregation input');
    expect(explanation).toContain(
      'De novo, unknown, and suspected compound heterozygous patterns',
    );
  });
});
