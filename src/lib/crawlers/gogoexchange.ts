import { extractPriceCandidates, pickPreferredCandidate } from './helper';
import { CrawlResult, PriceInfo } from '../types';

const SITE_ORDER: Array<{ type: 'lotte' | 'shinsegae' | 'hyundai'; tabClass: string }> = [
  { type: 'lotte', tabClass: 'tabs1' },
  { type: 'shinsegae', tabClass: 'tabs2' },
  { type: 'hyundai', tabClass: 'tabs3' },
];

const MIN_PRICE = 10000;
const MAX_PRICE = 1000000;

function parseRowText(rowText: string, preferredMethod: 'cash' | 'transfer' = 'transfer') {
  const candidates = extractPriceCandidates(rowText).filter(
    (candidate) => candidate.price > MIN_PRICE && candidate.price <= MAX_PRICE
  );
  return pickPreferredCandidate(candidates, preferredMethod);
}

async function loadRenderedRows(url: string): Promise<string[] | null> {
  try {
    const puppeteerMod = await import('puppeteer');
    const puppeteer = (puppeteerMod as any).default ?? puppeteerMod;
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      const rows = await page.evaluate(() =>
        [...document.querySelectorAll('div.tab-editor.tabs1, div.tab-editor.tabs2, div.tab-editor.tabs3')].map(
          (el) => {
            const dataRows = [...el.querySelectorAll('tr')].filter((tr) => tr.querySelectorAll('td').length >= 2);
            const firstDataRow = dataRows[1] || dataRows[0] || null;
            const firstCell = firstDataRow?.querySelectorAll('td')[1] || null;
            const secondCell = firstDataRow?.querySelectorAll('td')[2] || null;
            return [firstCell?.textContent || '', secondCell?.textContent || '']
              .map((s) => s.replace(/\s+/g, ' ').trim())
              .filter(Boolean);
          }
        ).flat()
      );
      await browser.close();
      return rows;
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error('Error loading rendered Gogo page:', error);
    return null;
  }
}

export async function crawlGogoExchange(): Promise<CrawlResult> {
  const url = 'https://www.gogoexchange.co.kr';
  const rowTexts = await loadRenderedRows(url);
  const prices: PriceInfo[] = [];

  if (rowTexts && rowTexts.length >= SITE_ORDER.length * 2) {
    for (let i = 0; i < SITE_ORDER.length; i += 1) {
      const site = SITE_ORDER[i];
      const buyText = rowTexts[i * 2] || '';
      const sellText = rowTexts[i * 2 + 1] || '';
      const buyPreferred = parseRowText(buyText, 'transfer');
      const sellPreferred = parseRowText(sellText, 'cash');
      if (!buyPreferred) continue;

      prices.push({
        giftCardType: site.type,
        denomination: 100000,
        buyPrice: buyPreferred.price,
        buyRate: buyPreferred.rate,
        sellPrice: sellPreferred?.price,
        sellRate: sellPreferred?.rate,
      });
    }
  }

  return {
    siteName: '고고상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}

export default { crawlGogoExchange };
