import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AppBar from '@/components/AppBar.vue';
import FooterBar from '@/components/FooterBar.vue';
import DisclaimerDialog from '@/components/DisclaimerDialog.vue';
import ContentContainer from '@/components/ContentContainer.vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import { iconConfig } from '@/config/iconConfig';

const wrappers = [];
async function render(component) {
  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  });
  await router.push('/');
  const vuetify = createVuetify({ components, directives, icons: iconConfig });
  const wrapper = mount(
    {
      components: { Subject: component },
      template: '<v-app><Subject /></v-app>',
    },
    { attachTo: document.body, global: { plugins: [pinia, router, vuetify] } },
  );
  wrappers.push(wrapper);
  return {
    wrapper,
    subject: wrapper.findComponent(component),
    settings: useSettingsStore(pinia),
    ui: useUiStore(pinia),
  };
}
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('application navigation and settings', () => {
  it.each([false, true])(
    'opens documentation in a separate tab from the navigation menu=%s',
    async (menu) => {
      const { wrapper } = await render(AppBar);
      if (menu) {
        await wrapper
          .find('[aria-label="Open navigation and settings"]')
          .trigger('click');
        await flushPromises();
      }
      const navigation = document.querySelector(
        menu ? '.v-overlay__content' : '.desktop-navigation',
      );
      const link = navigation.querySelector('a[href="/docs/"]');
      expect(link).toBeTruthy();
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('aria-label')).toMatch(/opens in a new tab/i);
      expect(
        navigation.querySelector('a[href="/genes"]').getAttribute('target'),
      ).toBeNull();
    },
  );
  it('exposes documentation and switches theme with an updated accessible label', async () => {
    const { wrapper, settings } = await render(AppBar);
    expect(wrapper.find('a[href="/docs/"]').exists()).toBe(true);
    const before = settings.isDarkMode;
    await wrapper.find('.theme-toggle').trigger('click');
    expect(settings.isDarkMode).toBe(!before);
    expect(wrapper.find('.theme-toggle').attributes('aria-label')).toBe(
      before ? 'Switch to dark theme' : 'Switch to light theme',
    );
  });
  it.each([false, true])(
    'copies the citation and reports clipboard failure=%s',
    async (failed) => {
      vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(
        async (text) => {
          expect(text).toContain('doi:10.1101/2025.09.29.25336840');
          if (failed) throw new Error('denied');
        },
      );
      const { wrapper, ui } = await render(AppBar);
      await wrapper
        .find('[aria-label="Open navigation and settings"]')
        .trigger('click');
      await flushPromises();
      const item = [...document.querySelectorAll('.v-list-item')].find((node) =>
        node.textContent.includes('Copy citation'),
      );
      expect(item).toBeTruthy();
      item.click();
      await flushPromises();
      expect(ui.notification.visible).toBe(true);
      expect(ui.notification.message).toMatch(
        failed ? /Could not copy/ : /Citation copied/,
      );
    },
  );
});

describe('footer and research acknowledgment', () => {
  it('toggles logs and updates acknowledgment information after accepting the dialog', async () => {
    const { wrapper, subject, settings, ui } = await render(FooterBar);
    await wrapper
      .find('[aria-label="Show/Hide Application Logs"]')
      .trigger('click');
    expect(ui.showLogViewer).toBe(true);
    await wrapper
      .find('[aria-label="View disclaimer information"]')
      .trigger('click');
    await flushPromises();
    expect(subject.vm.disclaimerDialogVisible).toBe(true);
    [...document.querySelectorAll('button')]
      .find((node) => node.textContent.includes('I Understand'))
      .click();
    await flushPromises();
    expect(settings.isDisclaimerAcknowledged).toBe(true);
    expect(subject.vm.formattedAcknowledgmentDate).toBeTruthy();
    expect(subject.vm.disclaimerDialogVisible).toBe(false);
    for (const link of wrapper.findAll('a[target="_blank"]')) {
      expect(link.attributes('rel')).toContain('noopener');
      expect(link.attributes('aria-label')).toBeTruthy();
    }
  });
  it('first-visit acknowledgment persists and tells the application to dismiss the modal', async () => {
    const { subject, settings } = await render(DisclaimerDialog);
    await flushPromises();
    [...document.querySelectorAll('button')]
      .find((node) => node.textContent.includes('I Understand'))
      .click();
    await flushPromises();
    expect(settings.isDisclaimerAcknowledged).toBe(true);
    expect(subject.emitted('acknowledged')).toHaveLength(1);
    expect(subject.vm.dialogVisible).toBe(false);
  });
  it('preserves the page content in its shared responsive container', () => {
    const wrapper = mount(ContentContainer, {
      slots: { default: '<h1>Assessment</h1>' },
      global: { plugins: [createVuetify({ components })] },
    });
    wrappers.push(wrapper);
    expect(wrapper.find('h1').text()).toBe('Assessment');
  });
});
