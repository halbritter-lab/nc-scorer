/* global document, window */
import process from 'node:process';
import console from 'node:console';
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://localhost:5173';
const detectorPath = process.argv[3];
if (!detectorPath)
  throw new Error(
    'Provide the path to Impeccable detect-antipatterns-browser.js',
  );
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const output = '.impeccable/design';
fs.mkdirSync(output, { recursive: true });
try {
  await page.goto(
    `${baseUrl}/scoring/NM_001009944.3:c.11935C%3ET?inheritance=Inherited+dominant&segregation=0.95&assembly=GRCh38`,
  );
  await page
    .getByRole('button', { name: 'I Understand and Agree', exact: true })
    .click();
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('button')].some(
        (button) =>
          button.textContent.includes('Download Results') && !button.disabled,
      ),
    undefined,
    { timeout: 120000 },
  );
  for (const theme of ['dark', 'light']) {
    if (theme === 'light')
      await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${output}/scoring-${theme}.png`,
      fullPage: true,
    });
    await page.evaluate(() => {
      document.documentElement.dataset.impeccableExtension = 'true';
    });
    if (theme === 'dark') await page.addScriptTag({ path: detectorPath });
    const findings = [];
    const height = await page.evaluate(
      () => document.documentElement.scrollHeight,
    );
    for (let offset = 0; offset < height; offset += 800) {
      await page.evaluate((value) => window.scrollTo(0, value), offset);
      findings.push(
        ...(await page.evaluate(() => window.impeccableDetectAsync())),
      );
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    fs.writeFileSync(
      `${output}/scoring-${theme}.json`,
      JSON.stringify(findings, null, 2),
    );
    console.log(theme, JSON.stringify(findings));
  }
} finally {
  await browser.close();
}
