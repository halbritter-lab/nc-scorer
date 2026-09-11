import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';
import { vuetifyMotionPlugin } from '../../scripts/vuetify-motion.js';

const require = createRequire(import.meta.url);
const filename = require.resolve(
  'vuetify/lib/components/VResponsive/VResponsive.css',
);
const upstream = readFileSync(filename, 'utf8');
const transition = /transition:\s*[^;]+;/g;

describe('Vuetify responsive motion adapter', () => {
  it.each([
    filename,
    '/project/node_modules/vuetify/lib/components/VResponsive/VResponsive.css',
    'C:\\project\\node_modules\\vuetify\\lib\\components\\VResponsive\\VResponsive.css',
    `${filename}?direct`,
  ])('removes the installed framework padding animation from %s', (id) => {
    const result = vuetifyMotionPlugin().transform(upstream, id);
    expect(result.code).not.toMatch(/transition:\s*padding-bottom/);
    expect(result.code).toContain('transition: none;');
    // Preserve every layout declaration, selector, and aspect-ratio sizing rule.
    expect(result.code.replace(transition, '')).toBe(
      upstream.replace(transition, ''),
    );
  });

  it.each([
    '/project/src/VResponsive.css',
    '/project/node_modules/vuetify/lib/components/VResponsive/VResponsive.js',
    '/project/node_modules/other/lib/components/VResponsive/VResponsive.css',
  ])('leaves unrelated modules untouched: %s', (id) => {
    expect(vuetifyMotionPlugin().transform(upstream, id)).toBeUndefined();
  });

  it.each([
    'components/VProgressLinear/VProgressLinear.css',
    'components/VToolbar/VToolbar.css',
    'components/VAvatar/VAvatar.css',
    'components/VList/VList.css',
    'components/VList/VListItem.css',
    'components/VFooter/VFooter.css',
    'components/VField/VField.css',
    'components/VTable/VTable.css',
    'components/VExpansionPanel/VExpansionPanel.css',
    'components/VNavigationDrawer/VNavigationDrawer.css',
    'styles/main.css',
  ])('removes only layout transitions from installed Vuetify %s', (module) => {
    const id = require.resolve(`vuetify/lib/${module}`);
    const original = readFileSync(id, 'utf8');
    const result = vuetifyMotionPlugin().transform(original, id);
    const before = postcss.parse(original);
    const after = postcss.parse(result?.code || original);
    const layout =
      /^(?:(?:min|max)-)?(?:width|height)$|^(?:padding|margin)(?:-[a-z-]+)?$|^(?:left|right|top|bottom)$/;
    after.walkDecls(/^transition(?:-property)?$/, (declaration) => {
      for (const item of postcss.list.comma(declaration.value)) {
        expect(
          postcss.list.space(item).some((token) => layout.test(token)),
        ).toBe(false);
      }
    });
    before.walkDecls(/^transition(?:-property)?$/, (declaration) =>
      declaration.remove(),
    );
    after.walkDecls(/^transition(?:-property)?$/, (declaration) =>
      declaration.remove(),
    );
    expect(after.toString()).toBe(before.toString());
  });

  it('preserves safe transition timing, functions, SVG stroke width, nested rules, and important declarations', () => {
    const css = `.field {
      width: 50%;
      transition: width 150ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms steps(2, end), transform var(--motion, 300ms) ease;
    }
    @media (min-width: 30rem) {
      .field { transition-property: opacity, width, transform !important; }
      .svg { transition: stroke-width 200ms, color 150ms; }
    }`;
    const result = vuetifyMotionPlugin().transform(css, filename);
    expect(result.code).toContain(
      'transition: opacity 200ms steps(2, end), transform var(--motion, 300ms) ease;',
    );
    expect(result.code).toContain(
      'transition-property: opacity, transform !important;',
    );
    expect(result.code).toContain(
      'transition: stroke-width 200ms, color 150ms;',
    );
    expect(result.code).toContain('width: 50%;');
    expect(result.code).toContain('@media (min-width: 30rem)');
  });

  it('leaves Vuetify CSS with no explicit layout transitions unchanged', () => {
    const css = '.field { width: 100%; transition: opacity 200ms ease; }';
    expect(vuetifyMotionPlugin().transform(css, filename)).toBeUndefined();
  });
});
