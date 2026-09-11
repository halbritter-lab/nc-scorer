import process from 'node:process';
import console from 'node:console';
import fs from 'node:fs';
import net from 'node:net';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:4173/';
const count = Number(process.argv[3] || 3);
const output = '.impeccable/lighthouse';
fs.mkdirSync(output, { recursive: true });
const socket = net.createServer();
await new Promise((resolve) => socket.listen(0, '127.0.0.1', resolve));
const port = socket.address().port;
await new Promise((resolve) => socket.close(resolve));
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: [`--remote-debugging-port=${port}`],
});
try {
  const results = [];
  for (let index = 0; index < count; index++) {
    const { lhr } = await lighthouse(url, {
      port,
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    fs.writeFileSync(
      `${output}/run-${index + 1}.json`,
      JSON.stringify(lhr, null, 2),
    );
    const result = {
      scores: Object.fromEntries(
        Object.entries(lhr.categories).map(([key, value]) => [
          key,
          Math.round(value.score * 100),
        ]),
      ),
      fcpMs: lhr.audits['first-contentful-paint'].numericValue,
      lcpMs: lhr.audits['largest-contentful-paint'].numericValue,
      tbtMs: lhr.audits['total-blocking-time'].numericValue,
      cls: lhr.audits['cumulative-layout-shift'].numericValue,
      transferBytes: lhr.audits['total-byte-weight'].numericValue,
    };
    results.push(result);
    fs.writeFileSync(
      `${output}/summary.json`,
      JSON.stringify(results, null, 2),
    );
    console.log(`Run ${index + 1}: ${JSON.stringify(result)}`);
  }
} finally {
  await browser.close();
}
