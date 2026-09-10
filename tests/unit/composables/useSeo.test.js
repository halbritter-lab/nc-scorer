// tests/unit/composables/useSeo.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import {
  useSeo,
  useGenePageSeo,
  useVariantPageSeo,
  useBatchPageSeo,
} from '@/composables/useSeo.js';

// Mock dependencies
const mockPatch = vi.fn();
const mockUseHead = vi.fn((meta) => ({ patch: mockPatch, meta }));

vi.mock('@unhead/vue', () => ({
  useHead: (meta) => mockUseHead(meta),
}));

const mockRoute = {
  name: 'gene',
  path: '/gene/PKD1',
  params: { gene: 'PKD1', variant: 'chr16-2138714-C-T' },
  query: {},
};

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

describe('SEO Composable (useSeo.js)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSeo base composable', () => {
    it('computes initial meta tags from customMeta and route', () => {
      const customMeta = {
        title: 'Custom Title',
        description: 'Custom Description',
      };

      const { metaTags, head } = useSeo(customMeta);

      expect(mockUseHead).toHaveBeenCalledTimes(1);
      expect(head).toBeDefined();
      expect(metaTags.value.title).toContain('Custom Title');
    });

    it('reactively updates meta tags when a ref is updated', () => {
      const customMetaRef = ref({
        title: 'Initial Title',
      });

      const { metaTags } = useSeo(customMetaRef);
      expect(metaTags.value.title).toContain('Initial Title');

      // Update the ref
      customMetaRef.value = {
        title: 'Updated Title',
      };

      expect(metaTags.value.title).toContain('Updated Title');
    });

    it('provides updateMeta method that patches head tags', () => {
      const customMeta = { title: 'Base Title' };
      const { updateMeta } = useSeo(customMeta);

      updateMeta({ title: 'Patched Title' });
      expect(mockPatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('useGenePageSeo', () => {
    it('returns empty meta when geneData is empty', () => {
      const geneData = ref(null);
      const { metaTags } = useGenePageSeo(geneData);

      // Falls back to base route metadata
      expect(metaTags.value).toBeDefined();
    });

    it('reacts when asynchronous geneData resolves', () => {
      const geneData = ref(null);
      const { metaTags } = useGenePageSeo(geneData);

      // Async data resolves
      geneData.value = {
        symbol: 'PKD1',
        name: 'Polycystin 1',
        inheritance: 'Autosomal dominant',
        phenotypes: ['Polycystic Kidney', 'Renal Cysts', 'Hypertension'],
      };

      expect(metaTags.value.title).toBe('PKD1 - Polycystin 1 | NC-Scorer');
      expect(metaTags.value.meta).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'description',
            content: expect.stringContaining('PKD1 (Polycystin 1) variants'),
          }),
        ])
      );
    });

    it('supports getter function via toValue (REA-02)', () => {
      const geneState = {
        symbol: 'COL4A5',
        name: 'Collagen Type IV Alpha 5',
        inheritance: 'X-linked',
      };

      const { metaTags } = useGenePageSeo(() => geneState);
      expect(metaTags.value.title).toBe('COL4A5 - Collagen Type IV Alpha 5 | NC-Scorer');
    });
  });

  describe('useVariantPageSeo', () => {
    it('returns formatted variant metadata when variantData is provided', () => {
      const variantData = ref({
        id: 'rs12345',
        gene: 'PKD1',
        consequence: 'missense_variant',
        frequency: '0.0001',
      });

      const { metaTags } = useVariantPageSeo(variantData);

      expect(metaTags.value.title).toBe('rs12345 in PKD1 - Variant Analysis | NC-Scorer');
      expect(metaTags.value.meta).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'description',
            content: expect.stringContaining('Analysis of PKD1 variant rs12345'),
          }),
        ])
      );
    });

    it('falls back to route params when variant fields are missing', () => {
      const variantData = ref({});
      const { metaTags } = useVariantPageSeo(variantData);

      expect(metaTags.value.title).toContain('PKD1');
    });
  });

  describe('useBatchPageSeo', () => {
    it('shows default upload description when batchData is empty', () => {
      const batchData = ref([]);
      const { metaTags } = useBatchPageSeo(batchData);

      expect(metaTags.value.title).toBe('Batch Variant Processing - Upload Your Data | NC-Scorer');
    });

    it('dynamically switches title and description when batchData is populated', () => {
      const batchData = ref([]);
      const { metaTags } = useBatchPageSeo(batchData);

      batchData.value = [
        { variant: 'var1' },
        { variant: 'var2' },
        { variant: 'var3' },
      ];

      expect(metaTags.value.title).toBe('Processing 3 Variants | NC-Scorer Batch Analysis');
    });
  });
});
