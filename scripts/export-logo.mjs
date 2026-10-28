import fs from 'node:fs/promises';
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 760, height: 240 }, deviceScaleFactor: 2 });
  const svg = await fs.readFile(new URL('../packages/theme/assets/images/royo-wordmark.svg', import.meta.url), 'utf8');
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${svg}`);
  await page.evaluate(() => document.fonts.ready);
  const target = new URL('../packages/theme/assets/images/royo-wordmark.png', import.meta.url);
  await page.locator('svg').screenshot({ path: target.pathname.replace(/^\/(\w:)/,'$1'), omitBackground: true });
  await fs.copyFile(target, new URL('../apps/web/public/assets/royo-wordmark.png', import.meta.url));
  const symbol = svg.replace('width="620" height="240" viewBox="0 0 620 240"','width="224" height="224" viewBox="0 0 224 224"').replace(/<text[^>]*>[\s\S]*?<\/text>/g, '');
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style>${symbol}`);
  const symbolTarget = new URL('../packages/theme/assets/images/royo-symbol.png', import.meta.url);
  await page.locator('svg').screenshot({path:symbolTarget.pathname.replace(/^\/(\w:)/,'$1'),omitBackground:true});
  await fs.copyFile(symbolTarget,new URL('../apps/web/public/assets/royo-symbol.png',import.meta.url));
} finally { await browser.close(); }
