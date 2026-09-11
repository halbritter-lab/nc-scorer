/* global localStorage, DOMException, console */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore.js';

beforeEach(() => setActivePinia(createPinia()));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('settings persistence', () => {
  it('persists validated user choices and restores them on reload', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    const settings = useSettingsStore();
    expect(settings.formattedDisclaimerDate).toBeNull();
    expect(settings.isDisclaimerAcknowledged).toBe(false);
    settings.setTheme(false);
    settings.toggleTheme();
    settings.setCacheEnabled(true);
    settings.toggleCache();
    settings.acknowledgeDisclaimer();
    settings.setTourStatus('completed');
    settings.setTourStatus('unrecognized');
    settings.setLogLevel('WARN');
    settings.setLogLevel('unrecognized');
    settings.dismissPreprintBanner();
    await nextTick();
    setActivePinia(createPinia());
    const restored = useSettingsStore();
    expect(restored).toMatchObject({
      isDarkMode: true,
      isCacheEnabled: false,
      tourStatus: 'completed',
      logLevel: 'WARN',
      isPreprintBannerDismissed: true,
      disclaimerAcknowledgedAt: '2026-01-15T12:00:00.000Z',
    });
    expect(restored.isDisclaimerAcknowledged).toBe(true);
    expect(restored.formattedDisclaimerDate).not.toBeNull();
    restored.resetTour();
    restored.resetPreprintBanner();
    await nextTick();
    const saved = JSON.parse(localStorage.getItem('nc-scorer-settings'));
    expect(saved.tourStatus).toBe('new');
    expect(saved.isPreprintBannerDismissed).toBe(false);
  });

  it('migrates the legacy theme, acknowledgement, tour and log preferences together', () => {
    localStorage.setItem('darkTheme', 'false');
    localStorage.setItem('disclaimerTimestamp', '2025-04-01T12:00:00.000Z');
    localStorage.setItem('nc-scorer-tour-status', 'completed');
    localStorage.setItem('nc_scorer_logLevel', 'ERROR');
    const settings = useSettingsStore();
    expect(settings).toMatchObject({
      isDarkMode: false,
      disclaimerAcknowledgedAt: '2025-04-01T12:00:00.000Z',
      tourStatus: 'completed',
      logLevel: 'ERROR',
    });
    expect(localStorage.getItem('darkTheme')).toBeNull();
    expect(localStorage.getItem('disclaimerTimestamp')).toBeNull();
  });

  it.each([
    ['skipped', null, 'skipped'],
    [null, 'true', 'skipped'],
    ['unknown', 'false', 'new'],
  ])(
    'migrates legacy tour status %s and shown=%s to %s',
    (status, shown, expected) => {
      if (status !== null)
        localStorage.setItem('nc-scorer-tour-status', status);
      if (shown !== null) localStorage.setItem('nc-scorer-tour-shown', shown);
      expect(useSettingsStore().tourStatus).toBe(expected);
    },
  );

  it.each(['true', 'false'])(
    'preserves the meaning of a legacy acknowledgement=%s',
    (acknowledged) => {
      localStorage.setItem('disclaimerAcknowledged', acknowledged);
      expect(useSettingsStore().isDisclaimerAcknowledged).toBe(
        acknowledged === 'true',
      );
    },
  );

  it.each(['null', '[]', '42', '{bad json'])(
    'recovers from invalid persisted settings %s',
    (stored) => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('nc-scorer-settings', stored);
      const settings = useSettingsStore();
      settings.setLogLevel('INFO');
      expect(settings.logLevel).toBe('INFO');
      expect(settings.isCacheEnabled).toBe(true);
    },
  );

  it('keeps legacy preferences available if migration cannot be saved', () => {
    localStorage.setItem('nc-scorer-cache-enabled', 'false');
    localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('Quota exceeded');
    });
    expect(useSettingsStore().isCacheEnabled).toBe(false);
    expect(localStorage.getItem('nc-scorer-cache-enabled')).toBe('false');
  });

  it('ignores an invalid legacy cache preference', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('nc-scorer-cache-enabled', 'not-json');
    expect(useSettingsStore().isCacheEnabled).toBe(true);
    expect(localStorage.getItem('nc-scorer-cache-enabled')).toBe('not-json');
  });

  it('retains a user change in memory when persistence fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const settings = useSettingsStore();
    localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('Quota exceeded');
    });
    settings.setCacheEnabled(false);
    await nextTick();
    expect(settings.isCacheEnabled).toBe(false);
  });
  it('starts and remains usable when localStorage access is blocked', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('Storage blocked', 'SecurityError');
    });
    const settings = useSettingsStore();
    settings.setCacheEnabled(false);
    expect(settings.isCacheEnabled).toBe(false);
  });

  it('persists migrated preferences before deleting legacy keys', async () => {
    localStorage.setItem('nc-scorer-cache-enabled', 'false');
    useSettingsStore();
    await nextTick();
    setActivePinia(createPinia());
    expect(useSettingsStore().isCacheEnabled).toBe(false);
  });

  it('prefers saved settings over stale legacy values', () => {
    localStorage.setItem(
      'nc-scorer-settings',
      JSON.stringify({ isCacheEnabled: false }),
    );
    localStorage.setItem('nc-scorer-cache-enabled', 'true');
    expect(useSettingsStore().isCacheEnabled).toBe(false);
  });
});
