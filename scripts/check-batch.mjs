// Run against a running development server; requests use the real configured APIs.
// node scripts/check-batch.mjs [baseUrl] [Impeccable browser detector path]
/* global document, window */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import process from 'node:process';
import console from 'node:console';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://localhost:5173';
const detectorPath = process.argv[3];
const directory = '.impeccable/batch-check';
await fs.mkdir(directory, { recursive: true });
const evidence = { states: {}, rows: {}, requests: [], runtimeErrors: [] };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const started = Date.now();
  page.on('pageerror', (error) => evidence.runtimeErrors.push(error.message));
  page.on('response', (response) => {
    if (
      response.url().includes('/ensembl') ||
      response.url().includes('.json')
    ) {
      evidence.requests.push({
        elapsedMs: Date.now() - started,
        url: response.url(),
        status: response.status(),
      });
    }
  });
  await page.goto(`${baseUrl}/batch`);
  await page
    .getByRole('button', { name: 'I Understand and Agree', exact: true })
    .click();
  if (detectorPath) {
    await page.evaluate(() => {
      document.documentElement.dataset.impeccableExtension = 'true';
    });
    await page.addScriptTag({ path: detectorPath });
  }
  const scan = async (name) => {
    await page.mouse.move(0, 0);
    // Let theme transitions and click ripples settle before measuring contrast.
    await page.waitForTimeout(650);
    const findings = [];
    if (detectorPath) {
      const height = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      for (let y = 0; y < height; y += 700) {
        await page.evaluate((offset) => window.scrollTo(0, offset), y);
        findings.push(
          ...(await page.evaluate(() => window.impeccableDetectAsync())),
        );
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    evidence.states[name] = findings;
    await page.screenshot({ path: `${directory}/${name}.png`, fullPage: true });
    console.log(
      name,
      JSON.stringify(
        findings.map((finding) => ({
          selector: finding.selector,
          findings: finding.findings.map((item) => ({
            type: item.type,
            detail: item.detail,
          })),
        })),
      ),
    );
  };
  const download = async (format, prefix) => {
    await page.getByRole('button', { name: 'Download', exact: true }).click();
    const pending = page.waitForEvent('download');
    await page.getByText(`Download as ${format}`, { exact: true }).click();
    const result = await pending;
    const path = `${directory}/${prefix}.${format.toLowerCase()}`;
    await result.saveAs(path);
    return fs.readFile(path, 'utf8');
  };
  const waitForCompletion = async () => {
    await page
      .getByRole('status')
      .filter({ hasText: 'Processing complete.' })
      .waitFor({ timeout: 300000 });
  };

  await scan('desktop-dark-initial');
  await page
    .getByRole('button', { name: 'Nephrology Genes', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Process Variants', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Cancel processing', exact: true })
    .waitFor();
  await scan('desktop-dark-loading');
  await waitForCompletion();
  const rows = JSON.parse(await download('JSON', 'nephrology'));
  evidence.rows.nephrology = rows;
  assert.deepEqual(
    rows.map((row) => row.geneSymbol),
    ['PKD1', 'COL4A5', 'CEP290'],
  );
  for (const row of rows) {
    assert.equal(row.error, '');
    assert.ok(
      [row.geneScore, row.variantScore, row.inheritanceScore].every(
        (score) => Number.isFinite(score) && score >= 0 && score <= 1,
      ),
    );
    assert.equal(
      row.ncs,
      (
        4 * row.geneScore +
        4 * row.variantScore +
        2 * row.inheritanceScore
      ).toFixed(3),
    );
  }
  for (const format of ['CSV', 'TSV']) {
    const content = await download(format, 'nephrology');
    for (const row of rows)
      assert.ok(content.includes(row.variant) && content.includes(row.ncs));
    assert.ok(content.includes('Error'));
  }
  console.log('Live nephrology rows:', JSON.stringify(rows));
  await scan('desktop-dark-results');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await scan('desktop-light-results');
  await page.setViewportSize({ width: 390, height: 844 });
  await scan('mobile-light-results');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await scan('mobile-dark-results');
  await page
    .getByRole('button', { name: 'Clear Results', exact: true })
    .click();
  await scan('mobile-dark-initial');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await scan('mobile-light-initial');

  await page.locator('textarea').fill('PKD1\n16-2090952-G-A');
  await page
    .getByRole('button', { name: 'Process Variants', exact: true })
    .click();
  await waitForCompletion();
  const mixed = JSON.parse(await download('JSON', 'mixed'));
  evidence.rows.mixed = mixed;
  assert.equal(mixed[0].ncs, 'N/A');
  assert.match(mixed[0].error, /Gene symbols alone cannot be scored/);
  assert.equal(mixed[1].geneSymbol, 'PKD1');
  assert.equal(mixed[1].error, '');
  assert.notEqual(mixed[1].ncs, 'N/A');
  assert.deepEqual(evidence.runtimeErrors, []);
  console.log('Live mixed valid/invalid batch passed.');
} finally {
  await fs.writeFile(
    `${directory}/evidence.json`,
    JSON.stringify(evidence, null, 2),
  );
  await browser.close();
}
