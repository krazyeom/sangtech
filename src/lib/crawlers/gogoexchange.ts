import { extractPriceCandidates, pickPreferredCandidate } from './helper';
import { CrawlResult, PriceInfo } from '../types';

const SITE_ORDER: Array<{ type: 'lotte' | 'shinsegae' | 'hyundai'; tabClass: string }> = [
  { type: 'lotte', tabClass: 'tabs1' },
  { type: 'shinsegae', tabClass: 'tabs2' },
  { type: 'hyundai', tabClass: 'tabs3' },
];

const MIN_PRICE = 10000;
const MAX_PRICE = 1000000;

function parseRowText(rowText: string) {
  const candidates = extractPriceCandidates(rowText).filter(
    (candidate) => candidate.price > MIN_PRICE && candidate.price <= MAX_PRICE
  );
  return pickPreferredCandidate(candidates);
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
            const secondCell = firstDataRow?.querySelectorAll('td')[1] || null;
            return (secondCell?.textContent || '').replace(/\s+/g, ' ').trim();
          }
        )
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

  if (rowTexts && rowTexts.length >= SITE_ORDER.length) {
    for (let i = 0; i < SITE_ORDER.length; i += 1) {
      const site = SITE_ORDER[i];
      const preferred = parseRowText(rowTexts[i] || '');
      if (!preferred) continue;

      prices.push({
        giftCardType: site.type,
        denomination: 100000,
        buyPrice: preferred.price,
        buyRate: preferred.rate,
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
