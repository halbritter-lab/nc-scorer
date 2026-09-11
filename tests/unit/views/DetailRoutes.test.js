import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import GeneView from '@/views/GeneView.vue';
import VariantView from '@/views/VariantView.vue';

describe('Detail route changes', () => {
  it('remounts gene evidence when the gene changes', async () => {
    const wrapper = shallowMount(GeneView, {
      props: { symbol: 'PKD1' },
      global: { renderStubDefaultSlot: true },
    });
    const first = wrapper.findComponent({ name: 'GeneCard' }).vm;
    await wrapper.setProps({ symbol: 'COL4A5' });
    expect(wrapper.findComponent({ name: 'GeneCard' }).vm).not.toBe(first);
    wrapper.unmount();
  });
  it('remounts variant evidence when the assembly changes', async () => {
    const wrapper = shallowMount(VariantView, {
      props: { variantInput: '1-55051215-G-GA', assembly: 'GRCh38' },
      global: { renderStubDefaultSlot: true },
    });
    const first = wrapper.findComponent({ name: 'VariantCard' }).vm;
    await wrapper.setProps({ assembly: 'GRCh37' });
    expect(wrapper.findComponent({ name: 'VariantCard' }).vm).not.toBe(first);
    wrapper.unmount();
  });
});
