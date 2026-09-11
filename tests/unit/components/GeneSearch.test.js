import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import GeneSearch from '@/components/GeneSearch.vue';

const { push, fetchIndices } = vi.hoisted(() => ({
  push: vi.fn(),
  fetchIndices: vi.fn(),
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/api/geneApi', () => ({ fetchGeneSearchIndices: fetchIndices }));
const render = () =>
  shallowMount(GeneSearch, {
    global: {
      stubs: {
        VAutocomplete: true,
        VAlert: true,
        VBtn: true,
        RouterLink: true,
      },
    },
  });

describe('Gene search', () => {
  beforeEach(() => {
    push.mockReset();
    fetchIndices.mockResolvedValue({
      hgncToSymbolMap: { 9008: 'PKD1' },
      combinedItems: [
        { symbol: 'PKD1', hgncId: 9008, display: 'PKD1 (HGNC:9008)' },
        { symbol: 'PKD2', hgncId: 9009, display: 'PKD2 (HGNC:9009)' },
        { symbol: 'CEP290', hgncId: 29021, display: 'Centrosomal protein 290' },
        {},
      ],
      symbolsIndex: ['PKD1', 'PKD2', 'CEP290'],
      hgncIndex: ['9008', '9009', '29021'],
    });
  });
  it('submits a typed symbol without requiring selection from the remote index', async () => {
    const wrapper = shallowMount(GeneSearch, {
      global: {
        stubs: {
          VAutocomplete: true,
          VAlert: true,
          VBtn: true,
          RouterLink: true,
        },
      },
    });
    await flushPromises();
    wrapper.vm.onTextInput('pkd1');
    wrapper.vm.search();
    expect(push).toHaveBeenCalledWith({
      name: 'GeneView',
      params: { symbol: 'PKD1' },
    });
    wrapper.unmount();
  });
  it.each([
    ['HGNC:9008', 'PKD1'],
    ['9008', 'PKD1'],
    ['PKD1 (HGNC:9008)', 'PKD1'],
    [{ symbol: 'PKD2' }, 'PKD2'],
    ['HGNC:99999', 'HGNC:99999'],
    ['99999', '99999'],
  ])('resolves selected or entered %j to %s', async (input, symbol) => {
    const wrapper = render();
    await flushPromises();
    wrapper.vm.searchQuery = input;
    await wrapper.find('form').trigger('submit');
    expect(push).toHaveBeenCalledWith({ name: 'GeneView', params: { symbol } });
    wrapper.unmount();
  });
  it('filters suggestions by symbol, identifier and display name', async () => {
    const wrapper = render();
    await flushPromises();
    expect(wrapper.vm.filteredItems).toEqual([]);
    for (const query of ['pkd1', '9008', 'HGNC:9008']) {
      wrapper.vm.onTextInput(query);
      expect(wrapper.vm.filteredItems.map((item) => item.symbol)).toContain(
        'PKD1',
      );
    }
    wrapper.vm.onTextInput('centrosomal');
    expect(wrapper.vm.filteredItems.map((item) => item.symbol)).toEqual([
      'CEP290',
    ]);
    wrapper.vm.onTextInput('no match');
    expect(wrapper.vm.filteredItems).toEqual([]);
    wrapper.unmount();
  });
  it('does not navigate from an empty search and keeps manual lookup usable after index failure', async () => {
    fetchIndices.mockRejectedValueOnce(new Error('Index unavailable'));
    const wrapper = render();
    await flushPromises();
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.error.message).toBe('Index unavailable');
    await wrapper.find('form').trigger('submit');
    expect(push).not.toHaveBeenCalled();
    wrapper.vm.onTextInput('PKD1');
    await wrapper.find('form').trigger('submit');
    expect(push).toHaveBeenCalledWith({
      name: 'GeneView',
      params: { symbol: 'PKD1' },
    });
    wrapper.unmount();
  });
  it('reports a synchronous navigation failure', async () => {
    push.mockImplementationOnce(() => {
      throw new Error('Navigation unavailable');
    });
    const wrapper = render();
    await flushPromises();
    wrapper.vm.searchQuery = 'PKD1';
    await wrapper.find('form').trigger('submit');
    expect(wrapper.vm.error.message).toMatch(/searching/);
    wrapper.unmount();
  });
});
