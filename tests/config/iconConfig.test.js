import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { VIcon } from 'vuetify/components';
import { aliases } from 'vuetify/iconsets/mdi-svg';
import { describe, expect, it } from 'vitest';
import { iconConfig, iconPaths } from '@/config/iconConfig';

function sourceIcons(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceIcons(filename);
    if (!/\.(vue|js|json)$/.test(entry.name) || entry.name === 'iconConfig.js')
      return [];
    return (
      readFileSync(filename, 'utf8').match(/mdi-[a-z0-9]+(?:-[a-z0-9]+)*/g) ||
      []
    );
  });
}

describe('application SVG icons', () => {
  it('renders a direct SVG path supplied by a component', () => {
    const path = 'M0 0h24v24H0z';
    const wrapper = mount(VIcon, {
      props: { icon: path },
      global: { plugins: [createVuetify({ icons: iconConfig })] },
    });
    expect(wrapper.find('svg path').attributes('d')).toBe(path);
    wrapper.unmount();
  });
  it('includes every icon referenced by components and runtime configuration', () => {
    const missing = [...new Set(sourceIcons(resolve('src')))].filter(
      (name) => !Object.hasOwn(iconPaths, name),
    );
    expect(missing).toEqual([]);
  });

  it('renders named icons as SVG while keeping selectors used by the tour', () => {
    const wrapper = mount(VIcon, {
      props: { icon: 'mdi-database-check' },
      global: { plugins: [createVuetify({ icons: iconConfig })] },
    });
    expect(wrapper.classes()).toContain('mdi-database-check');
    expect(wrapper.find('svg path').exists()).toBe(true);
    expect(wrapper.find('svg path').attributes('d')).toMatch(/^M/);
    wrapper.unmount();
  });

  it('renders all Vuetify control aliases without a font', () => {
    const vuetify = createVuetify({ icons: iconConfig });
    for (const alias of Object.keys(aliases)) {
      const wrapper = mount(VIcon, {
        props: { icon: `$${alias}` },
        global: { plugins: [vuetify] },
      });
      expect(wrapper.find('svg path').exists(), alias).toBe(true);
      expect(wrapper.find('svg path').attributes('d'), alias).toMatch(/^[Mm]/);
      wrapper.unmount();
    }
  });
});
