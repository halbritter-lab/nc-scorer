/* global document, window */
import process from 'node:process';
import console from 'node:console';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://localhost:5173';
const detectorPath = process.argv[3];
if (!detectorPath)
  throw new Error('Provide the Impeccable browser detector path');
const output = '.impeccable/modals';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const reports = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.goto(baseUrl);
    await page
      .getByRole('button', { name: 'I Understand and Agree', exact: true })
      .click();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      document.documentElement.dataset.impeccableExtension = 'true';
    });
    await page.addScriptTag({ path: detectorPath });
    for (const theme of ['dark', 'light']) {
      if (theme === 'light')
        await page
          .getByRole('button', { name: 'Switch to light theme' })
          .click();
      for (const [name, label] of [
        ['disclaimer', 'View disclaimer information'],
        ['logs', 'Show/Hide Application Logs'],
      ]) {
        await page.getByRole('button', { name: label, exact: true }).click();
        await page.mouse.move(0, 0);
        await page.waitForTimeout(600);
        const findings = await page.evaluate(() =>
          window.impeccableDetectAsync(),
        );
        reports.push({ width, theme, name, findings });
        await page.screenshot({
          path: `${output}/design-${name}-${theme}-${width}.png`,
        });
        await page.keyboard.press('Escape');
      }
    }
    await page.close();
  }
  fs.writeFileSync(
    `${output}/impeccable.json`,
    JSON.stringify(reports, null, 2),
  );
  for (const report of reports) {
    console.log(JSON.stringify(report));
    assert.equal(
      report.findings.length,
      0,
      `${report.name} ${report.theme} ${report.width} has design warnings`,
    );
  }
} finally {
  await browser.close();
}
