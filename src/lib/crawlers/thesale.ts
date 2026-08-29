import { CrawlResult, PriceInfo } from '../types';

const SITE_URL = 'https://thesaletk.cafe24.com';

const parseMoney = (text: string) => {
  const match = text.replace(/\s+/g, ' ').match(/([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
};

const parseRate = (text: string) => {
  const match = text.match(/([\d.]+)\s*%/);
  return match ? parseFloat(match[1]) : 0;
};

export async function crawlThesale(): Promise<CrawlResult> {
  const prices: PriceInfo[] = [];

  try {
    let puppeteer;
    try {
      puppeteer = (await import(/* webpackIgnore: true */ 'puppeteer')).default;
    } catch (error) {
      console.error('Puppeteer is not available for 더세일상품권 crawl:', error);
      return {
        siteName: '더세일상품권(삼성)',
        siteUrl: SITE_URL,
        timestamp: new Date(),
        prices,
      };
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
    });

    try {
      const page = await browser.newPage();
      await page.goto(SITE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForSelector('table.gift-table');

      const rows = await page.$$eval('table.gift-table tr', (trs) =>
        trs.map((tr) =>
          Array.from(tr.querySelectorAll('th,td')).map((cell) =>
            (cell.textContent || '').replace(/\s+/g, ' ').trim()
          )
        )
      );

      for (const cells of rows) {
        if (cells.length < 3) continue;
        const brandText = cells[0].replace(/\s+/g, '');
        if (brandText.includes('모바일')) continue;

        let type: PriceInfo['giftCardType'] | null = null;
        if (brandText.includes('롯데')) type = 'lotte';
        else if (brandText.includes('신세계')) type = 'shinsegae';
        else if (brandText.includes('현대')) type = 'hyundai';
        if (!type) continue;

        const buyCell = cells[1];
        const sellCell = cells[2];
        const buyPrice = parseMoney(buyCell);
        const sellPrice = parseMoney(sellCell);
        const buyRate = parseRate(buyCell) || (buyPrice > 0 ? Math.round(((100000 - buyPrice) / 100000) * 10000) / 100 : 0);
        const sellRate = parseRate(sellCell) || (sellPrice > 0 ? Math.round(((100000 - sellPrice) / 100000) * 10000) / 100 : 0);

        if (buyPrice > 0) {
          prices.push({
            giftCardType: type,
            denomination: 100000,
            buyPrice,
            buyRate,
            sellPrice: sellPrice > 0 ? sellPrice : undefined,
            sellRate: sellPrice > 0 ? sellRate : undefined,
          });
        }
      }
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error crawling 더세일상품권:', error);
  }

  return {
    siteName: '더세일상품권(삼성)',
    siteUrl: SITE_URL,
    timestamp: new Date(),
    prices,
  };
}
