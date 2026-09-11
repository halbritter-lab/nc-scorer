/* global document */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';
import { URL } from 'node:url';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://localhost:5173';
const reportPath = process.argv[3] || '.impeccable/tab-layout/report.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const width of [1440, 390]) {
    for (const [component, tab, form] of [
      ['VariantSearch', 'Variant details', '.variant-search-card'],
      ['GeneSearch', 'Find a gene', '.gene-search-form'],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
      });
      let release;
      let requests = 0;
      const held = new Promise((resolve) => {
        release = resolve;
      });
      try {
        const page = await context.newPage();
        await page.route(
          `**/src/components/${component}.vue*`,
          async (route) => {
            if (new URL(route.request().url()).searchParams.has('vue'))
              return route.continue();
            requests += 1;
            await held;
            await route.continue();
          },
        );
        await page.goto(baseUrl);
        await page
          .getByRole('button', { name: 'I Understand and Agree', exact: true })
          .click();
        await page.locator('.scoring-search-card').waitFor();
        await page.evaluate(() => document.fonts.ready);
        const panel = page.locator('.search-panel');
        const height = async () => (await panel.boundingBox()).height;
        const before = await height();
        const startupRequests = requests;
        await page.getByRole('tab', { name: tab, exact: true }).click();
        await page.waitForTimeout(700);
        const loading = await height();
        const heldRequests = requests;
        release();
        await page.locator(form).waitFor();
        await page.waitForTimeout(700);
        const resolved = await height();
        await page
          .getByRole('tab', { name: 'Score a variant', exact: true })
          .click();
        await page.waitForTimeout(700);
        const returned = await height();
        await page.getByRole('tab', { name: tab, exact: true }).click();
        await page.waitForTimeout(700);
        const cached = await height();
        const resizedWidth = width === 1440 ? 900 : 700;
        await page.setViewportSize({ width: resizedWidth, height: 1000 });
        await page.waitForTimeout(700);
        const resized = await height();
        const resizedMinHeight = await panel.evaluate(
          (element) => element.style.minHeight,
        );
        const result = {
          width,
          component,
          startupRequests,
          heldRequests,
          before,
          loading,
          resolved,
          returned,
          cached,
          resizedWidth,
          resized,
          resizedMinHeight,
        };
        report.push(result);
        console.log(JSON.stringify(result));
      } finally {
        release();
        await context.close();
      }
    }
  }
  for (const result of report) {
    assert.equal(
      result.startupRequests,
      0,
      `${result.component} must remain lazy`,
    );
    assert.equal(
      result.heldRequests,
      1,
      `${result.component} first load must be held`,
    );
    for (const state of ['loading', 'resolved', 'returned', 'cached']) {
      assert.ok(
        Math.abs(result[state] - result.before) <= 1,
        `${result.width}px ${result.component} ${state}: ${result.before}px -> ${result[state]}px`,
      );
    }
    assert.ok(
      ['', '0px'].includes(result.resizedMinHeight),
      'A width change must release the old reservation',
    );
  }
} finally {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  await browser.close();
}
