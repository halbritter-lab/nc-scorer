// tests/unit/components/PreprintBanner.test.js
/* global localStorage, DOMException */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithPlugins } from '../../utils/testUtils.js';
import PreprintBanner from '@/components/PreprintBanner.vue';
import { useRoute } from 'vue-router';
import { logService } from '@/services/logService.js';

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}));

describe('PreprintBanner Component (PreprintBanner.vue)', () => {
  it('opens the paper in a separate tab and records the click without dismissing the banner', async () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/' });
    const wrapper = mountWithPlugins(PreprintBanner);
    const link = wrapper.get(
      'a[href="https://doi.org/10.1101/2025.09.29.25336840"]',
    );
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toContain('noopener');
    await link.trigger('click');
    expect(wrapper.find('.preprint-banner').exists()).toBe(true);
    expect(
      logService.entries.value.some(
        (entry) => entry.rawData?.doi === '10.1101/2025.09.29.25336840',
      ),
    ).toBe(true);
    wrapper.unmount();
  });
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('remains dismissible when reading browser storage is blocked', async () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/' });
    const read = localStorage.getItem.getMockImplementation();
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'nc_scorer_preprint_banner_dismissed') {
        throw new DOMException('Storage blocked', 'SecurityError');
      }
      return read(key);
    });
    try {
      const wrapper = mountWithPlugins(PreprintBanner);
      expect(wrapper.find('.preprint-banner').exists()).toBe(true);
      await wrapper
        .find('[aria-label="Dismiss preprint banner"]')
        .trigger('click');
      expect(wrapper.find('.preprint-banner').exists()).toBe(false);
      wrapper.unmount();
    } finally {
      localStorage.getItem.mockImplementation(read);
    }
  });

  it('renders on the home route (/) when not dismissed', () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/' });
    const wrapper = mountWithPlugins(PreprintBanner);
    expect(wrapper.find('.preprint-banner').exists()).toBe(true);
    expect(wrapper.text()).toContain('Preprint on medRxiv');
    expect(wrapper.text()).toContain('10.1101/2025.09.29.25336840');
  });

  it('does NOT render on non-home routes (/score/..., /batch, /genes)', () => {
    const nonHomeRoutes = [
      '/score/16-2090952-G-A/Inherited%20dominant/0.95',
      '/scoring/16-2090952-G-A',
      '/batch',
      '/genes',
      '/about',
      '/methodology',
    ];

    for (const path of nonHomeRoutes) {
      vi.mocked(useRoute).mockReturnValue({ path });
      const wrapper = mountWithPlugins(PreprintBanner);
      expect(wrapper.find('.preprint-banner').exists()).toBe(false);
    }
  });

  it('persists dismissal in localStorage and does not render after dismissal', async () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/' });
    const wrapper = mountWithPlugins(PreprintBanner);
    expect(wrapper.find('.preprint-banner').exists()).toBe(true);

    await wrapper.vm.dismissBanner();

    expect(localStorage.getItem('nc_scorer_preprint_banner_dismissed')).toBe(
      'true',
    );
    expect(wrapper.vm.isPreprintBannerDismissed).toBe(true);
  });

  it('remains hidden if previously dismissed in localStorage', () => {
    localStorage.setItem('nc_scorer_preprint_banner_dismissed', 'true');
    vi.mocked(useRoute).mockReturnValue({ path: '/' });
    const wrapper = mountWithPlugins(PreprintBanner);
    expect(wrapper.find('.preprint-banner').exists()).toBe(false);
  });
});
