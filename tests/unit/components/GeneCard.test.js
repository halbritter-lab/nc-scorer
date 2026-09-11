// tests/unit/components/GeneCard.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import GeneCard from '@/components/GeneCard.vue';
import { fetchGeneDetails } from '@/api/geneApi.js';
import { mountWithPlugins } from '../../utils/testUtils.js';

// Mock fetchGeneDetails
vi.mock('@/api/geneApi.js', () => ({
  fetchGeneDetails: vi.fn(),
}));

describe('GeneCard Component (GeneCard.vue)', () => {
  const mockGeneData = {
    symbol: 'PKD1',
    name: 'Polycystin 1',
    ngs: 0.85,
    evidenceCount: 12,
    geneSet: 'Kidney Genetics Curated',
  };

  const createMockRetryState = () => ({
    retryStates: {
      gene: {
        attempts: 0,
        inProgress: false,
        component: '',
        reset: vi.fn(),
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loaded gene evidence on one card surface', async () => {
    fetchGeneDetails.mockResolvedValueOnce({ data: mockGeneData });
    const wrapper = mountWithPlugins(GeneCard, {
      props: { symbol: 'PKD1' },
      global: { provide: { retryState: createMockRetryState() } },
    });
    await flushPromises();
    expect(wrapper.text()).toContain('PKD1');
    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.findAll('.v-card .v-card')).toHaveLength(0);
    wrapper.unmount();
  });

  it.each([undefined, null, NaN, '', ' ', 2])(
    'reports missing or invalid gene score %s as unavailable',
    async (score) => {
      fetchGeneDetails.mockResolvedValueOnce({
        data: { ...mockGeneData, ngs: score },
      });
      const wrapper = mountWithPlugins(GeneCard, {
        props: { symbol: 'PKD1' },
        global: { provide: { retryState: createMockRetryState() } },
      });
      await flushPromises();
      expect(wrapper.emitted('gene-score-updated')?.at(-1)?.[0]).toEqual(
        expect.objectContaining({
          score: null,
          symbol: 'PKD1',
          error: expect.any(String),
        }),
      );
      expect(wrapper.text()).toContain('Gene score is missing or invalid');
      wrapper.unmount();
    },
  );

  it('preserves a measured zero gene score', async () => {
    fetchGeneDetails.mockResolvedValueOnce({
      data: { ...mockGeneData, ngs: 0 },
    });
    const wrapper = mountWithPlugins(GeneCard, {
      props: { symbol: 'PKD1' },
      global: { provide: { retryState: createMockRetryState() } },
    });
    await flushPromises();
    expect(wrapper.emitted('gene-score-updated').at(-1)[0].score).toBe(0);
    expect(wrapper.text()).not.toContain('Gene score is missing or invalid');
    wrapper.unmount();
  });

  it('renders title and shows skeleton loader while loading', async () => {
    // Delay resolution to check loading state
    fetchGeneDetails.mockImplementation(() => new Promise(() => {}));

    const wrapper = mountWithPlugins(GeneCard, {
      props: { symbol: 'PKD1' },
      global: {
        provide: {
          retryState: createMockRetryState(),
        },
      },
    });

    expect(wrapper.text()).toContain('Gene Details for "PKD1"');
    expect(wrapper.find('.loading-container').exists()).toBe(true);
  });

  it('successfully fetches gene details and emits gene-score-updated event', async () => {
    fetchGeneDetails.mockResolvedValueOnce({
      data: mockGeneData,
      source: { fromCache: false },
    });

    const wrapper = mountWithPlugins(GeneCard, {
      props: { symbol: 'PKD1' },
      global: {
        provide: {
          retryState: createMockRetryState(),
        },
      },
    });

    await flushPromises();

    // Verify loading is false
    expect(wrapper.find('.loading-container').exists()).toBe(false);

    // Verify event emission
    const emitted = wrapper.emitted('gene-score-updated');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0]).toEqual(
      expect.objectContaining({
        symbol: 'PKD1',
        score: 0.85,
        formattedData: expect.any(Object),
      }),
    );
  });

  it('shows cache indicator chip when data is retrieved from cache', async () => {
    fetchGeneDetails.mockResolvedValueOnce({
      data: mockGeneData,
      source: { fromCache: true },
    });

    const wrapper = mountWithPlugins(GeneCard, {
      props: { symbol: 'PKD1' },
      global: {
        provide: {
          retryState: createMockRetryState(),
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Cached');
  });

  it('displays error alert when fetch fails', async () => {
    fetchGeneDetails.mockRejectedValueOnce(new Error('Network failure'));

    const wrapper = mountWithPlugins(GeneCard, {
      props: { symbol: 'PKD1' },
      global: {
        provide: {
          retryState: createMockRetryState(),
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain('Network failure');
    expect(wrapper.emitted('gene-score-updated')?.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        score: null,
        symbol: 'PKD1',
        error: 'Network failure',
      }),
    );
  });

  it('displays max retries message when attempts reach threshold', async () => {
    const retryState = createMockRetryState();
    retryState.retryStates.gene.attempts = 4;

    fetchGeneDetails.mockRejectedValueOnce(new Error('Server unavailable'));

    const wrapper = mountWithPlugins(GeneCard, {
      props: { symbol: 'PKD1' },
      global: {
        provide: {
          retryState,
        },
      },
    });

    await flushPromises();

    expect(wrapper.text()).toContain(
      'Failed to load gene data after multiple attempts',
    );
  });
});
