import { beforeEach, describe, expect, it, vi } from 'vitest';
import { shallowMount, mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import ScoringSearch from '@/components/ScoringSearch.vue';
import VariantSearch from '@/components/VariantSearch.vue';

const { push, route } = vi.hoisted(() => ({
  push: vi.fn(),
  route: { params: {}, query: {} },
}));
const mountForm = () =>
  shallowMount(ScoringSearch, {
    global: {
      stubs: {
        VTextField: true,
        VSelect: true,
        VAlert: true,
        VBtn: true,
        RouterLink: true,
      },
    },
  });
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => route,
}));

describe('Scoring search submission', () => {
  it('uses edited field values when a researcher submits a compound assessment', async () => {
    const wrapper = mount(ScoringSearch, {
      global: {
        plugins: [createVuetify({ components })],
        stubs: { RouterLink: true },
      },
    });
    await wrapper.find('#scoring-variant-input').setValue('12-88101183-A-G');
    const selects = wrapper.findAllComponents(components.VSelect);
    selects[0].vm.$emit('update:modelValue', 'GRCh37');
    selects[1].vm.$emit(
      'update:modelValue',
      'Compound heterozygous (confirmed)',
    );
    await wrapper.vm.$nextTick();
    const fields = wrapper.findAllComponents(components.VTextField);
    const second = fields.find((field) =>
      field.props('label')?.includes('Second'),
    );
    await second.find('input').setValue('12-88077263-G-T');
    await wrapper.find('#segregation-probability-input').setValue('0.2');
    await wrapper.find('form').trigger('submit');
    expect(push).toHaveBeenCalledWith({
      name: 'ScoringView',
      params: { variantInput: '12-88101183-A-G' },
      query: {
        inheritance: 'Compound heterozygous (confirmed)',
        assembly: 'GRCh37',
        segregation: '0.2',
        variant2: '12-88077263-G-T',
      },
    });
    wrapper.unmount();
  });
  beforeEach(() => {
    push.mockClear();
    route.query = {};
  });
  it('allows missing segregation without shifting assembly into a positional field', () => {
    const wrapper = mountForm();
    wrapper.vm.variantInput = '1-55051215-G-GA';
    wrapper.vm.inheritance = 'Inherited dominant';
    wrapper.vm.segregation = '';
    wrapper.vm.assembly = 'GRCh37';
    wrapper.vm.searchScoring();
    expect(push).toHaveBeenCalledWith({
      name: 'ScoringView',
      params: { variantInput: '1-55051215-G-GA' },
      query: {
        inheritance: 'Inherited dominant',
        segregation: '',
        assembly: 'GRCh37',
      },
    });
    wrapper.unmount();
  });
  it('preserves suspected compound inheritance when editing an existing search', () => {
    route.query = {
      variant2: '12-88077263-G-T',
      inheritance: 'Compound heterozygous (suspected)',
    };
    const wrapper = mountForm();
    expect(wrapper.vm.inheritance).toBe('Compound heterozygous (suspected)');
    wrapper.unmount();
  });
  it('does not prefill an unprovided segregation probability as complete evidence', () => {
    const wrapper = mountForm();
    expect(wrapper.vm.segregation).toBe('');
    wrapper.unmount();
  });
  it.each([
    {
      first: '',
      second: '',
      inheritance: 'Inherited dominant',
      segregation: '',
    },
    {
      first: '1-55051215-G-GA',
      second: '',
      inheritance: 'Compound heterozygous (confirmed)',
      segregation: '',
    },
    {
      first: '1-55051215-G-GA',
      second: '',
      inheritance: 'Inherited dominant',
      segregation: '2',
    },
  ])(
    'blocks invalid input before navigating: %o',
    async ({ first, second, inheritance, segregation }) => {
      const wrapper = mountForm();
      Object.assign(wrapper.vm, {
        variantInput: first,
        variantInput2: second,
        inheritance,
        segregation,
      });
      await wrapper.find('form').trigger('submit');
      expect(push).not.toHaveBeenCalled();
      expect(wrapper.vm.error).toBeTruthy();
      wrapper.unmount();
    },
  );
  it('preserves both compound variants and entered segregation in named URL fields', async () => {
    const wrapper = mountForm();
    Object.assign(wrapper.vm, {
      variantInput: '12-88101183-A-G',
      variantInput2: '12-88077263-G-T',
      inheritance: 'Compound heterozygous (confirmed)',
      segregation: '0.5',
      assembly: 'GRCh38',
    });
    await wrapper.find('form').trigger('submit');
    expect(push).toHaveBeenCalledWith({
      name: 'ScoringView',
      params: { variantInput: '12-88101183-A-G' },
      query: {
        inheritance: 'Compound heterozygous (confirmed)',
        segregation: '0.5',
        assembly: 'GRCh38',
        variant2: '12-88077263-G-T',
      },
    });
    wrapper.unmount();
  });
  it('ignores a stale segregation value when the inheritance pattern does not use it', async () => {
    const wrapper = mountForm();
    Object.assign(wrapper.vm, {
      variantInput: '1-55051215-G-GA',
      inheritance: 'Denovo',
      segregation: '2',
    });
    await wrapper.find('form').trigger('submit');
    expect(push.mock.lastCall[0].query.segregation).toBe('');
    wrapper.unmount();
  });
  it('normalizes query arrays when editing an assessment', () => {
    route.query = {
      variant2: ['12-88077263-G-T'],
      assembly: ['GRCh37'],
      segregation: ['0.3'],
    };
    const wrapper = mountForm();
    expect(wrapper.vm.assembly).toBe('GRCh37');
    expect(wrapper.vm.segregation).toBe('0.3');
    wrapper.unmount();
  });
});

describe('variant lookup submission', () => {
  it('submits the variant and assembly chosen through the rendered controls', async () => {
    push.mockClear();
    const wrapper = mount(VariantSearch, {
      global: {
        plugins: [createVuetify({ components })],
        stubs: { RouterLink: true },
      },
    });
    await wrapper.find('#variant-search-input').setValue('16-2140953-G-A');
    wrapper
      .findComponent(components.VSelect)
      .vm.$emit('update:modelValue', 'GRCh37');
    await wrapper.find('form').trigger('submit');
    expect(push).toHaveBeenCalledWith({
      name: 'VariantView',
      params: { variantInput: '16-2140953-G-A', assembly: 'GRCh37' },
    });
    wrapper.unmount();
  });
  it('blocks empty input and submits a valid variant with the selected assembly', async () => {
    push.mockClear();
    const wrapper = shallowMount(VariantSearch, {
      global: {
        stubs: {
          VTextField: true,
          VSelect: true,
          VAlert: true,
          VBtn: true,
          RouterLink: true,
        },
      },
    });
    await wrapper.find('form').trigger('submit');
    expect(push).not.toHaveBeenCalled();
    expect(wrapper.vm.error).toBeTruthy();
    wrapper.vm.variantInput = '1-55051215-G-GA';
    wrapper.vm.assembly = 'GRCh37';
    await wrapper.find('form').trigger('submit');
    expect(wrapper.vm.error).toBe(null);
    expect(push).toHaveBeenCalledWith({
      name: 'VariantView',
      params: { variantInput: '1-55051215-G-GA', assembly: 'GRCh37' },
    });
    wrapper.unmount();
  });
});
