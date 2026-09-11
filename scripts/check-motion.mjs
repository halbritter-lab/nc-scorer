/* global document, getComputedStyle */
import process from 'node:process';
import console from 'node:console';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const baseUrl = process.argv[2] || 'http://localhost:5173';
const findings = [];
async function inspect(state) {
  const matches = await page.evaluate(() =>
    [...document.querySelectorAll('body *')].flatMap((element) => {
      const style = getComputedStyle(element);
      if (!element.getBoundingClientRect().height || style.display === 'none')
        return [];
      const properties = style.transitionProperty
        .split(',')
        .map((value) => value.trim());
      const layout = properties.filter((property) =>
        /^(?:width|height|min-width|max-width|min-height|max-height|padding(?:-.+)?|margin(?:-.+)?)$/.test(
          property,
        ),
      );
      if (element.matches('.v-main') && properties.includes('all')) {
        layout.push('padding-bottom (via all)');
      }
      if (
        !layout.length ||
        !style.transitionDuration
          .split(',')
          .some((value) => parseFloat(value) > 0)
      )
        return [];
      return [
        {
          element: element.tagName.toLowerCase(),
          class: element.getAttribute('class'),
          properties: layout,
        },
      ];
    }),
  );
  findings.push(...matches.map((match) => ({ state, ...match })));
}
try {
  await page.goto(baseUrl);
  await page
    .getByRole('button', { name: 'I Understand and Agree', exact: true })
    .click();
  await inspect('home');
  await page
    .getByRole('button', { name: 'Open navigation and settings' })
    .click();
  await inspect('navigation menu');
  await page.keyboard.press('Escape');
  await page.locator('#inheritance-pattern-select').press('Enter');
  await inspect('inheritance options');
  await page.keyboard.press('Escape');
  await page.goto(`${baseUrl}/genes`);
  await page.locator('.gene-data-table').waitFor();
  await inspect('gene table');
  await page.goto(`${baseUrl}/batch`);
  await page
    .getByRole('textbox', { name: 'Paste Variants (One per line)' })
    .fill('1-55051215-G-GA');
  await page.getByRole('button', { name: 'Process Variants' }).click();
  await inspect('batch progress');
  await page.goto(
    `${baseUrl}/scoring/NM_001009944.3:c.11935C%3ET?inheritance=Inherited+dominant&segregation=0.95&assembly=GRCh38`,
  );
  await page.locator('.variant-card').waitFor();
  await inspect('scoring page');
  console.log(JSON.stringify({ findings }, null, 2));
  assert.equal(
    findings.length,
    0,
    'Rendered controls must not animate layout properties',
  );
} finally {
  await browser.close();
}
