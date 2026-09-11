import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import DataDisplayRow from '@/components/DataDisplayRow.vue';

const render = (props) =>
  mount(DataDisplayRow, {
    props,
    global: { plugins: [createVuetify({ components })] },
  });

describe('annotation evidence display', () => {
  it('links a displayed genomic position using its separate machine-readable region', () => {
    const wrapper = render({
      config: {
        label: 'Position',
        linkPattern:
          'https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=%s',
      },
      value: '16-2140953-G-A (GRCh37)',
      linkValue: 'chr16:2140953',
    });
    expect(wrapper.find('a').attributes('href')).toBe(
      'https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=chr16%3A2140953',
    );
    expect(wrapper.find('a').text()).toContain('16-2140953-G-A (GRCh37)');
    wrapper.unmount();
  });
  it('preserves numeric zero in an external identifier link', () => {
    const wrapper = render({
      config: { label: 'Identifier', linkPattern: 'https://example.org/%s' },
      value: 0,
    });
    expect(wrapper.find('a').attributes('href')).toBe('https://example.org/0');
    wrapper.unmount();
  });
  it('does not create a link for unavailable evidence', () => {
    const wrapper = render({
      config: {
        label: 'Missing',
        style: 'chip',
        linkPattern: 'https://example.org/%s',
      },
      value: null,
    });
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.text()).toContain('NA');
    wrapper.unmount();
  });
  it.each(['gene', 'variant', 'inheritance', 'unknown'])(
    'shows a measured %s subscore as a chip',
    (scoreType) => {
      const wrapper = render({
        config: { label: 'Score', style: 'chip', isKeyScore: true, scoreType },
        value: 0.75,
      });
      expect(wrapper.find('.v-chip').text()).toContain('0.75');
      wrapper.unmount();
    },
  );
});
