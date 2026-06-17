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
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the elements to load (wait for any price to appear)
    await page.waitForFunction(() => document.body.innerText.includes('10만'));

    // Extract text from the whole page and find the prices
    const extractedData = await page.evaluate(() => {
      // In Bubble, usually things are rendered in divs with text
      // We will look for elements containing "신세계", "롯데", "현대"
      // and their adjacent elements containing the price and rate
      
      const results: { type: string, buyPrice: number, rate: number }[] = [];
      const allTextDivs = Array.from(document.querySelectorAll('div')).filter(el => {
        return el.innerText && el.children.length === 0 && (el.innerText.includes('%') || el.innerText.includes('100,000') || el.innerText.includes('신세계') || el.innerText.includes('롯데') || el.innerText.includes('현대'));
      });
      
      // We will just return the innerText of all leaf nodes and parse them in Node.js
      return Array.from(document.querySelectorAll('*'))
        .filter(el => el.children.length === 0 && el.textContent?.trim().length! > 0)
        .map(el => el.textContent?.trim() || '');
    });

    // Simple heuristical parsing of the extracted linear text
    let currentType: PriceInfo['giftCardType'] | null = null;
    let currentAmount = 0;

    for (let i = 0; i < extractedData.length; i++) {
      const text = extractedData[i];
      if (text.includes('신세계')) currentType = 'shinsegae';
      else if (text.includes('현대')) currentType = 'hyundai';
      else if (text.includes('롯데')) currentType = 'lotte';

      if (text.includes('100,000') || text.includes('10만')) {
        currentAmount = 100000;
      }

      // If we see a percentage like "3.2%" or price like "96,500"
      if (currentType && currentAmount === 100000) {
         // This is a naive parsing. Since we don't know the exact structure,
         // we might need to adjust.
         // Let's just try to parse any 5 digit number starting with 9 as a buy price
         const priceMatch = text.match(/^9[0-9],[0-9]{3}(원)?$/);
         if (priceMatch) {
            const price = parseInt(priceMatch[0].replace(/,/g, ''), 10);
            // Look ahead for rate
            let rate = 0;
            for (let j = 1; j <= 3; j++) {
               if (extractedData[i+j] && extractedData[i+j].includes('%')) {
                  const rateMatch = extractedData[i+j].match(/([0-9.]+)%/);
                  if (rateMatch) rate = parseFloat(rateMatch[1]);
                  break;
               }
            }
            if (!prices.find(p => p.giftCardType === currentType)) {
               prices.push({
                  giftCardType: currentType,
                  denomination: 100000,
                  buyPrice: price,
                  buyRate: rate
               });
               currentType = null;
            }
         }
      }
    }

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
