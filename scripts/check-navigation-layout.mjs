/* global document, window, Node, getComputedStyle */
import process from 'node:process';
import console from 'node:console';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const baseUrl = process.argv[2] || 'http://localhost:5173';
async function heading() {
  return page.locator('main h1').evaluate((element) => {
    const style = getComputedStyle(element);
    const text = [...element.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );
    const range = document.createRange();
    range.selectNodeContents(text || element);
    const rect = range.getBoundingClientRect();
    const content = document.querySelector(
      '.search-workspace, .combined-score-wrapper',
    );
    return {
      x: rect.x + window.scrollX,
      y: element.getBoundingClientRect().top + window.scrollY,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      contentTop: content.getBoundingClientRect().top + window.scrollY,
    };
  });
}
try {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(baseUrl);
    await page.locator('main h1').waitFor();
    const acknowledgment = page.getByRole('button', {
      name: 'I Understand and Agree',
      exact: true,
    });
    if (await acknowledgment.count()) await acknowledgment.click();
    await page.evaluate(() => document.fonts.ready);
    const home = await heading();
    await page
      .getByRole('link')
      .filter({ hasText: '1-55051215-G-GA' })
      .first()
      .click();
    await page.waitForURL('**/scoring/**');
    await page.getByRole('heading', { level: 1 }).waitFor();
    const scoring = await heading();
    console.log(JSON.stringify({ width, home, scoring }));
    assert.deepEqual(
      scoring,
      home,
      'Home and scoring page title typography and origin must match',
    );
    await page.getByRole('link', { name: 'NC-Scorer home' }).click();
    await page
      .getByRole('heading', { name: 'Prioritize kidney disease variants' })
      .waitFor();
    assert.deepEqual(
      await heading(),
      home,
      'Returning home must restore the same heading geometry',
    );
  }
} finally {
  await browser.close();
}
