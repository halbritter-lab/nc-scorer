import { it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mountWithPlugins } from '../../utils/testUtils';
import VariantCard from '@/components/VariantCard.vue';
import { queryVariant } from '@/api/variantApi';

vi.mock('@/api/variantApi', () => ({ queryVariant: vi.fn() }));
it('uses the annotation assembly for genomic summary and UCSC links', async () => {
  vi.mocked(queryVariant).mockResolvedValue({
    data: {
      variantKey: '12-88101183-A-G',
      annotationData: [
        {
          assembly_name: 'GRCh37',
          seq_region_name: '12',
          start: 88101183,
          end: 88101183,
          nephro_variant_score: 0.5,
          transcript_consequences: [],
        },
      ],
    },
  });
  const wrapper = mountWithPlugins(VariantCard, {
    props: { variantInput: '12-88101183-A-G', assembly: 'GRCh37' },
  });
  await flushPromises();
  expect(wrapper.text()).toContain('GRCh37');
  const links = wrapper.findAll('a').map((link) => link.attributes('href'));
  expect(links.some((link) => link?.includes('db=hg19'))).toBe(true);
  wrapper.unmount();
});
