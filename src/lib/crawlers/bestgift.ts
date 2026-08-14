import { CrawlResult, PriceInfo } from '../types';

export async function crawlBestgift(): Promise<CrawlResult> {
  const url = 'https://bestgiftcard.kr/';
  const displayUrl = 'https://bestgiftcard.kr/';
  const prices: PriceInfo[] = [];

  let browser;
  try {
    let puppeteer;
    try {
      // @ts-ignore: puppeteer is optionally installed for crawling environments
      puppeteer = (await import(/* webpackIgnore: true */ 'puppeteer')).default;
    } catch (e) {
      console.warn('Puppeteer is not installed. Skipping bestgiftcard crawl.');
      return {
        siteName: '베스트상품권',
        siteUrl: displayUrl,
        timestamp: new Date(),
        prices: []
      };
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 3000 });
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('10만'));

    const rows = await page.evaluate(() =>
      Array.from(document.querySelectorAll('*'))
        .filter((el) => el.children.length === 0 && (el.textContent || '').trim().length > 0)
        .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
    );

    let currentType: PriceInfo['giftCardType'] | null = null;
    let collecting = false;
    let collectedPrices: number[] = [];

    const flush = () => {
      if (!currentType || collectedPrices.length === 0) return;
      const eligible = collectedPrices.filter((price) => price > 10000 && price <= 100000);
      if (eligible.length === 0) return;
      const buyPrice = eligible[0];
      const sellPrice = eligible[1] ?? undefined;
      const buyRate = Math.round(((100000 - buyPrice) / 100000) * 10000) / 100;
      const sellRate = sellPrice ? Math.round(((100000 - sellPrice) / 100000) * 10000) / 100 : undefined;
      if (!prices.find((p) => p.giftCardType === currentType)) {
        prices.push({
          giftCardType: currentType,
          denomination: 100000,
          buyPrice,
          buyRate,
          sellPrice,
          sellRate,
        });
      }
    };

    for (const row of rows) {
      const text = row.replace(/\s+/g, ' ').trim();
      const normalized = text.replace(/\s+/g, '');

      let nextType: PriceInfo['giftCardType'] | null = null;
      if (normalized.includes('롯데상품권') && normalized.includes('10만') && !normalized.includes('50만')) nextType = 'lotte';
      else if (normalized.includes('신세계상품권') && normalized.includes('10만') && !normalized.includes('50만')) nextType = 'shinsegae';
      else if (normalized.includes('현대상품권') && normalized.includes('10만') && !normalized.includes('50만')) nextType = 'hyundai';

      if (nextType) {
        flush();
        currentType = nextType;
        collecting = true;
        collectedPrices = [];
        continue;
      }

      if (!currentType || !collecting) continue;
      if (normalized.includes('사은품') || normalized.includes('증정') || normalized.includes('모바일') || normalized.includes('50만')) continue;

      const priceMatch = text.match(/^([\d,]+)원?$/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        if (price > 10000) collectedPrices.push(price);
      }
    }
    flush();

  } catch (error) {
    console.error('Error crawling bestgiftcard:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return {
    siteName: '베스트상품권',
    siteUrl: displayUrl,
    timestamp: new Date(),
    prices
  };
}
