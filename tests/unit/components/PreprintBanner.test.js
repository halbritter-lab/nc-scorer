// tests/unit/components/PreprintBanner.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithPlugins } from '../../utils/testUtils.js';
import PreprintBanner from '@/components/PreprintBanner.vue';
import { useRoute } from 'vue-router';

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
}));

describe('PreprintBanner Component (PreprintBanner.vue)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
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

    expect(localStorage.getItem('nc_scorer_preprint_banner_dismissed')).toBe('true');
    expect(wrapper.vm.isPreprintBannerDismissed).toBe(true);
  });

  it('remains hidden if previously dismissed in localStorage', () => {
    localStorage.setItem('nc_scorer_preprint_banner_dismissed', 'true');
    vi.mocked(useRoute).mockReturnValue({ path: '/' });
    const wrapper = mountWithPlugins(PreprintBanner);
    expect(wrapper.find('.preprint-banner').exists()).toBe(false);
  });
});
