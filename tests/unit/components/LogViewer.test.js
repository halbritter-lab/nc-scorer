import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { mountWithPlugins } from '../../utils/testUtils.js';
import LogViewer from '@/components/LogViewer.vue';
import { logService, LogLevel } from '@/services/logService';
import { useUiStore } from '@/stores/uiStore';

let wrapper;
let pinia;
let downloads;

const entry = (level, displayMessage, rawData = null) => ({
  level,
  displayMessage,
  rawData,
  timestamp: '2026-09-11T12:34:56Z',
});

function mountLogs(entries = []) {
  logService.entries.value.splice(
    0,
    logService.entries.value.length,
    ...entries,
  );
  wrapper = mountWithPlugins(LogViewer, {
    pinia,
    attachTo: document.body,
    global: {
      stubs: {
        VDialog: {
          name: 'VDialog',
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<section role="dialog"><slot /></section>',
        },
      },
    },
  });
  return wrapper;
}

function button(icon) {
  return wrapper
    .findAllComponents({ name: 'VBtn' })
    .find((component) => component.props('icon') === icon);
}

beforeEach(() => {
  pinia = createPinia();
  setActivePinia(pinia);
  logService.setLevel(LogLevel.DEBUG);
  logService.clear();
  downloads = [];
  URL.createObjectURL.mockClear().mockReturnValue('blob:log-download');
  URL.revokeObjectURL.mockClear();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
    function () {
      downloads.push({ filename: this.download, href: this.href });
    },
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('log viewer workflow', () => {
  it('returns focus to the opening control when the dialog unmounts', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    mountLogs();
    wrapper.get('input[placeholder="Search"]').element.focus();
    wrapper.unmount();
    wrapper = null;
    expect(document.activeElement).toBe(opener);
  });
  it('exposes a labeled dialog and closes when the dialog is dismissed', async () => {
    mountLogs();
    useUiStore().openLogViewer();
    await flushPromises();
    const dialog = wrapper.findComponent({ name: 'VDialog' });
    expect(dialog.exists()).toBe(true);
    expect(wrapper.get('[aria-label="Download logs"]').exists()).toBe(true);
    expect(wrapper.get('[aria-label="Clear logs"]').exists()).toBe(true);
    expect(wrapper.get('[aria-label="Close logs"]').exists()).toBe(true);
    dialog.vm.$emit('update:modelValue', false);
    await flushPromises();
    expect(useUiStore().showLogViewer).toBe(false);
  });
  it('renders log levels and limits visible rows to the latest twenty', () => {
    mountLogs(
      Array.from({ length: 24 }, (_, index) =>
        entry(
          ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CUSTOM'][index % 5],
          `Message ${index}`,
        ),
      ),
    );
    expect(wrapper.text()).toContain('Logs (24)');
    expect(wrapper.findAll('.log-entry')).toHaveLength(20);
    expect(wrapper.findAll('.log-entry')[0].text()).toContain('Message 4');
    expect(wrapper.findAll('.log-entry')[19].text()).toContain('Message 23');
    expect(wrapper.find('.log-level-error').exists()).toBe(true);
    expect(wrapper.find('.log-level-warn').exists()).toBe(true);
  });

  it('combines exact level and case-insensitive message or structured-data filters', async () => {
    mountLogs([
      entry('INFO', 'Loaded gene', { symbol: 'PKD1' }),
      entry('ERROR', 'PKD1 lookup failed'),
      entry('WARN', 'Slow request', { symbol: 'COL4A5' }),
    ]);
    await wrapper.get('input[placeholder="Search"]').setValue('pkd1');
    expect(wrapper.findAll('.log-entry')).toHaveLength(2);
    wrapper.vm.filterLevel = 'ERROR';
    await flushPromises();
    expect(wrapper.findAll('.log-entry')).toHaveLength(1);
    expect(wrapper.text()).toContain('PKD1 lookup failed');
    await wrapper.get('input[placeholder="Search"]').setValue('absent');
    expect(wrapper.text()).toContain('No logs matching your filters.');
  });

  it('updates the real log threshold through the minimum-level control', async () => {
    mountLogs();
    const select = wrapper
      .findAllComponents({ name: 'VSelect' })
      .find((component) => component.props('label') === 'Min Level');
    select.vm.$emit('update:modelValue', LogLevel.ERROR);
    await flushPromises();
    logService.info('Below threshold');
    logService.error('Report this');
    expect(logService.currentLogLevel.value).toBe(LogLevel.ERROR);
    expect(logService.entries.value.map((item) => item.displayMessage)).toEqual(
      ['Report this'],
    );
  });

  it('expands and collapses raw data and resets expansion when filters change', async () => {
    mountLogs([entry('INFO', 'Gene loaded', { symbol: 'PKD1' })]);
    await wrapper.get('.log-entry').trigger('click');
    expect(wrapper.get('pre').text()).toContain('"symbol": "PKD1"');
    await wrapper.get('.log-entry').trigger('click');
    expect(wrapper.find('pre').exists()).toBe(false);
    await wrapper.get('.log-entry').trigger('click');
    await wrapper.get('input[placeholder="Search"]').setValue('gene');
    expect(wrapper.find('pre').exists()).toBe(false);
  });

  it('displays string data and reports circular data without crashing', async () => {
    const circular = {};
    circular.self = circular;
    mountLogs([
      { ...entry('DEBUG', 'Text payload', 'plain text'), id: 'existing-id' },
      entry('ERROR', 'Circular payload', circular),
    ]);
    await wrapper.findAll('.log-entry')[0].trigger('click');
    expect(wrapper.text()).toContain('plain text');
    await wrapper.findAll('.log-entry')[1].trigger('click');
    expect(wrapper.text()).toContain('[Data cannot be displayed]');
    await wrapper.get('input[placeholder="Search"]').setValue('circular');
    expect(wrapper.findAll('.log-entry')).toHaveLength(1);
    expect(wrapper.text()).toContain('Circular payload');
  });

  it('downloads all stored entries, including those hidden by the current filter', async () => {
    mountLogs([
      entry('INFO', 'Loaded'),
      entry('ERROR', 'Failed', { status: 500 }),
    ]);
    wrapper.vm.filterLevel = 'ERROR';
    await flushPromises();
    await button('mdi-download').trigger('click');
    const data = JSON.parse(await URL.createObjectURL.mock.calls[0][0].text());
    expect(data.map((item) => item.displayMessage)).toEqual([
      'Loaded',
      'Failed',
    ]);
    expect(data[1].rawData).toEqual({ status: 500 });
    expect(downloads).toEqual([
      {
        filename: expect.stringMatching(/^nc-scorer-logs-.*\.json$/),
        href: 'blob:log-download',
      },
    ]);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:log-download');
  });

  it('keeps the viewer usable when download serialization fails', async () => {
    const circular = {};
    circular.self = circular;
    mountLogs([entry('ERROR', 'Circular payload', circular)]);
    await button('mdi-download').trigger('click');
    expect(downloads).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Circular payload');
    expect(console.error).toHaveBeenCalledWith(
      'Error downloading logs:',
      expect.any(Error),
    );
  });

  it('clears stored rows and expanded data, and closes through the UI store', async () => {
    mountLogs([entry('INFO', 'Original message', { value: 1 })]);
    useUiStore().showLogViewer = true;
    await wrapper.get('.log-entry').trigger('click');
    await button('mdi-delete-sweep').trigger('click');
    expect(wrapper.find('pre').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Original message');
    expect(logService.entries.value.map((item) => item.displayMessage)).toEqual(
      ['Cleared 1 log entries'],
    );
    await button('mdi-close').trigger('click');
    expect(useUiStore().showLogViewer).toBe(false);
  });

  it('ignores missing entries while searching and contains malformed level-filter errors', async () => {
    mountLogs([entry('INFO', 'Valid entry')]);
    logService.entries.value.push(null);
    await wrapper.get('input[placeholder="Search"]').setValue('valid');
    expect(wrapper.findAll('.log-entry')).toHaveLength(1);
    wrapper.vm.filterLevel = 'ERROR';
    await flushPromises();
    expect(wrapper.text()).toContain('No logs matching your filters.');
    expect(console.error).toHaveBeenCalledWith(
      'Error filtering log entries:',
      expect.any(TypeError),
    );
  });

  it('preserves rendering if an immutable entry cannot receive an ID', () => {
    mountLogs([Object.freeze(entry('INFO', 'Immutable entry'))]);
    expect(wrapper.text()).toContain('Immutable entry');
    expect(console.error).toHaveBeenCalledWith(
      'Error in log viewer onMounted:',
      expect.any(TypeError),
    );
  });
});
