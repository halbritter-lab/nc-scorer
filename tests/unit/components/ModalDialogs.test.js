import { afterEach, describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { mountWithPlugins } from '../../utils/testUtils.js';
import DisclaimerDialog from '@/components/DisclaimerDialog.vue';
import FooterBar from '@/components/FooterBar.vue';
import { useSettingsStore } from '@/stores/settingsStore';

let wrapper;
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = '';
});

describe('research disclaimer dialog modes', () => {
  it('requires first-use acknowledgment and persists it once accepted', async () => {
    const pinia = createPinia();
    wrapper = mountWithPlugins(DisclaimerDialog, {
      pinia,
      attachTo: document.body,
    });
    await flushPromises();
    expect(wrapper.findComponent({ name: 'VDialog' }).props('persistent')).toBe(
      true,
    );
    expect(
      document.querySelector('[aria-label="Close research disclaimer"]'),
    ).toBeNull();
    expect(document.querySelector('#disclaimer-dialog-title').tagName).toBe(
      'H2',
    );
    const agree = [...document.querySelectorAll('button')].find((node) =>
      node.textContent.includes('I Understand'),
    );
    agree.click();
    await flushPromises();
    expect(useSettingsStore(pinia).isDisclaimerAcknowledged).toBe(true);
    expect(wrapper.emitted('acknowledged')).toHaveLength(1);
  });

  it('lets an acknowledged disclaimer close without changing its saved date', async () => {
    const pinia = createPinia();
    const settings = useSettingsStore(pinia);
    settings.disclaimerAcknowledgedAt = '2026-09-10T12:00:00.000Z';
    wrapper = mountWithPlugins(DisclaimerDialog, {
      pinia,
      props: { requireAcknowledgment: false },
      attachTo: document.body,
    });
    await flushPromises();
    expect(wrapper.findComponent({ name: 'VDialog' }).props('persistent')).toBe(
      false,
    );
    document.querySelector('[aria-label="Close research disclaimer"]').click();
    await flushPromises();
    expect(wrapper.emitted('closed')).toHaveLength(1);
    expect(wrapper.emitted('acknowledged')).toBeUndefined();
    expect(settings.disclaimerAcknowledgedAt).toBe('2026-09-10T12:00:00.000Z');
  });

  it('reuses the same disclaimer when opened from the footer and supports reopening', async () => {
    const pinia = createPinia();
    useSettingsStore(pinia).acknowledgeDisclaimer();
    wrapper = mountWithPlugins(FooterBar, { pinia, attachTo: document.body });
    await wrapper
      .get('[aria-label="View disclaimer information"]')
      .trigger('click');
    await flushPromises();
    expect(wrapper.findComponent(DisclaimerDialog).exists()).toBe(true);
    wrapper
      .findComponent({ name: 'VDialog' })
      .vm.$emit('update:modelValue', false);
    await flushPromises();
    expect(wrapper.findComponent(DisclaimerDialog).exists()).toBe(false);
    await wrapper
      .get('[aria-label="View disclaimer information"]')
      .trigger('click');
    await flushPromises();
    expect(wrapper.findComponent(DisclaimerDialog).exists()).toBe(true);
  });
});
