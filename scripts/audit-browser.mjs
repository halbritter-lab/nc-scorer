/* global document, innerWidth */
import process from 'node:process';
import console from 'node:console';
import { URL } from 'node:url';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

// Run against Vite dev for proxy coverage, or preview for production workflow coverage.
const baseURL = process.argv[2] || 'http://localhost:5173';
const output = process.argv[3] || '.impeccable/browser';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordHar: { path: `${output}/requests.har`, content: 'omit' },
});
const page = await context.newPage();
page.setDefaultTimeout(30000);
const requests = [];
const errors = [];
const checks = [];
let current = 'startup';
page.on('pageerror', (error) =>
  errors.push({ check: current, message: error.message }),
);
page.on('console', (message) => {
  if (message.type() === 'error')
    errors.push({ check: current, console: message.text() });
});
page.on('response', (response) =>
  requests.push({
    check: current,
    url: response.url(),
    status: response.status(),
    type: response.request().resourceType(),
  }),
);
page.on('requestfailed', (request) =>
  requests.push({
    check: current,
    url: request.url(),
    error: request.failure()?.errorText,
  }),
);
async function check(name, run) {
  const only = process.argv[4]?.split(',');
  if (only && name !== 'first-visit' && !only.includes(name)) return;
  current = name;
  const start = Date.now();
  try {
    await run();
    checks.push({ name, passed: true, elapsedMs: Date.now() - start });
    console.log(`PASS ${name}`);
  } catch (error) {
    await page
      .screenshot({
        path: `${output}/${name.replaceAll('/', '_')}-failure.png`,
        fullPage: true,
      })
      .catch(() => {});
    await fs.writeFile(
      `${output}/${name.replaceAll('/', '_')}-failure.txt`,
      await page
        .locator('body')
        .innerText()
        .catch(() => 'No body'),
    );
    checks.push({
      name,
      passed: false,
      elapsedMs: Date.now() - start,
      message: error.message,
    });
    console.log(`FAIL ${name}: ${error.message}`);
  }
  await fs.writeFile(
    `${output}/report.json`,
    JSON.stringify({ baseURL, checks, errors, requests }, null, 2),
  );
}
async function go(path) {
  await page.goto(`${baseURL}${path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.locator('main h1').waitFor();
}
async function capture(name) {
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  const layout = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  if (layout.document > layout.viewport + 1)
    throw new Error(`Horizontal overflow: ${JSON.stringify(layout)}`);
}
try {
  await check('first-visit', async () => {
    await go('/');
    await page
      .getByRole('button', { name: 'I Understand and Agree', exact: true })
      .click();
    await page.locator('#scoring-variant-input').waitFor();
    await capture('home-dark-desktop');
  });
  await check('theme-and-mobile-navigation', async () => {
    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await capture('home-light-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('home-light-mobile');
    await page
      .getByRole('button', { name: 'Open navigation and settings' })
      .click();
    await page.getByRole('link', { name: 'Batch', exact: true }).last().click();
    await page
      .getByRole('heading', { name: 'Batch variant scoring' })
      .waitFor();
    await capture('batch-mobile');
    await go('/');
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await capture('home-dark-mobile');
    await page.setViewportSize({ width: 1440, height: 1000 });
  });
  await check('form-validation', async () => {
    await go('/');
    await page.getByRole('button', { name: 'Calculate score' }).click();
    await page
      .getByRole('alert')
      .filter({ hasText: 'Variant is required' })
      .waitFor();
    if (new URL(page.url()).pathname !== '/')
      throw new Error('Invalid form navigated');
  });
  await check('gene-search', async () => {
    await page.getByRole('tab', { name: 'Find a gene' }).click();
    await page.locator('#gene-search-input').fill('PKD1');
    await page
      .getByRole('option')
      .filter({ hasText: /^PKD1\b/ })
      .first()
      .click();
    await page.getByRole('button', { name: 'Look up gene' }).click();
    await page.getByRole('heading', { name: 'Gene Details: PKD1' }).waitFor();
    await page
      .locator('.gene-card .v-skeleton-loader')
      .waitFor({ state: 'hidden', timeout: 90000 });
    if (await page.locator('.gene-card .v-alert').count())
      throw new Error(await page.locator('.gene-card .v-alert').innerText());
    await capture('gene-detail');
  });
  await check('gene-table-and-export', async () => {
    await go('/genes');
    await page
      .getByRole('textbox', { name: 'Search by Gene Symbol or HGNC ID' })
      .fill('PKD1');
    await page
      .getByRole('button', { name: 'Download Data' })
      .click({ timeout: 90000 });
    const download = page.waitForEvent('download');
    await page.getByText('Download as CSV', { exact: true }).click();
    await (await download).saveAs(`${output}/gene-export.csv`);
    await capture('gene-table');
  });
  await check('variant-GRCh38', async () => {
    await go('/');
    await page
      .getByRole('tab', { name: 'Variant details', exact: true })
      .click();
    await page.locator('#variant-search-input').fill('1-55051215-G-GA');
    await page.getByRole('button', { name: 'Look up variant' }).click();
    await page.locator('.variant-card').waitFor();
    await page
      .locator('.variant-card .v-skeleton-loader')
      .waitFor({ state: 'hidden', timeout: 120000 });
    if (await page.locator('.variant-card .v-alert').count())
      throw new Error(
        await page.locator('.variant-card .v-alert').first().innerText(),
      );
    await capture('variant-GRCh38');
  });
  await check('score-GRCh37-missing-segregation', async () => {
    await go('/');
    await page.locator('#scoring-variant-input').fill('16-2140953-G-A');
    await page.locator('#scoring-assembly-select').press('Enter');
    await page
      .getByRole('option', { name: 'GRCh37 / hg19', exact: true })
      .click();
    await page.locator('#inheritance-pattern-select').press('Enter');
    await page
      .getByRole('option', { name: 'Inherited dominant', exact: true })
      .click();
    await page.getByRole('button', { name: 'Calculate score' }).click();
    await page.waitForURL('**/scoring/**');
    await page
      .getByRole('button', { name: 'Download Results', exact: true })
      .click({ timeout: 150000 });
    await page.keyboard.press('Escape');
    await capture('score-GRCh37');
    if (
      !requests.some(
        (request) =>
          request.check === current && request.url.includes('/ensembl_grch37/'),
      )
    )
      throw new Error('GRCh37 proxy request absent');
  });
  await check('batch-process-export-clear', async () => {
    await go('/batch');
    await page
      .getByRole('textbox', { name: 'Paste Variants (One per line)' })
      .fill('1-55051215-G-GA\tInherited dominant\t0.95');
    await page.getByRole('button', { name: 'Process Variants' }).click();
    await page
      .getByText('Batch Results', { exact: true })
      .waitFor({ timeout: 150000 });
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    const download = page.waitForEvent('download');
    await page.getByText('Download as CSV', { exact: true }).click();
    await (await download).saveAs(`${output}/batch-export.csv`);
    await capture('batch-results');
    await page.getByRole('button', { name: 'Clear Results' }).click();
    await page
      .getByText('Batch Results', { exact: true })
      .waitFor({ state: 'hidden' });
  });
  for (const path of ['/about', '/methodology', '/not-a-real-route']) {
    await check(path, async () => {
      await go(path);
      await capture(path.slice(1));
    });
  }
  await check('documentation', async () => {
    for (const path of [
      '/docs/',
      '/docs/guide/usage',
      '/docs/api/variant-api',
      '/docs/faq',
    ]) {
      const response = await page.goto(`${baseURL}${path}`);
      if (response.status() !== 200)
        throw new Error(`${path}: HTTP ${response.status()}`);
      await page.getByRole('heading', { level: 1 }).first().waitFor();
      if (await page.getByText('Page Not Found', { exact: true }).count()) {
        throw new Error(`${path} rendered the missing-page fallback`);
      }
    }
  });
  await check('tour', async () => {
    await go('/');
    await page
      .getByRole('button', { name: 'Open navigation and settings' })
      .click();
    await page.getByText('Take a tour', { exact: true }).click();
    await page.getByText('Skip Tour', { exact: true }).click();
    await page.locator('.shepherd-element').waitFor({ state: 'hidden' });
  });
} finally {
  await context.close();
  await browser.close();
  await fs.writeFile(
    `${output}/report.json`,
    JSON.stringify({ baseURL, checks, errors, requests }, null, 2),
  );
}
if (checks.some((result) => !result.passed) || errors.length)
  process.exitCode = 1;
