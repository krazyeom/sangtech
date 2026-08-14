import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, PriceInfo } from '../types';

export async function crawlWoorigift(): Promise<CrawlResult> {
  const url = 'http://www.woorigiftcard.com/';
  const prices: PriceInfo[] = [];

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    $('table tr').each((_, tr) => {
      const tds = $(tr).find('td');
      if (tds.length >= 4) {
        const productName = $(tds[0]).text().replace(/\s+/g, '');
        if (!productName) return;

        let type: PriceInfo['giftCardType'] | null = null;
        if (productName.includes('신세계')) type = 'shinsegae';
        else if (productName.includes('현대')) type = 'hyundai';
        else if (productName.includes('롯데')) type = 'lotte';

        if (type && productName.includes('10만')) {
          const buyText = $(tds[2]).text().replace(/\s+/g, '');
          const sellText = $(tds[3]).text().replace(/\s+/g, '');
          const buyMatch = buyText.match(/([\d,\.]+)[원]?.*?[\[\(]([\d\.]+)\s*%/);
          const sellMatch = sellText.match(/([\d,\.]+)[원]?.*?[\[\(]([\d\.]+)\s*%/);

          if (buyMatch) {
            const buyPrice = parseInt(buyMatch[1].replace(/[^\d]/g, ''), 10);
            const buyRate = parseFloat(buyMatch[2]);
            const sellPrice = sellMatch ? parseInt(sellMatch[1].replace(/[^\d]/g, ''), 10) : undefined;
            const sellRate = sellMatch ? parseFloat(sellMatch[2]) : undefined;

            if (buyPrice > 10000 && buyPrice <= 100000 && !prices.find((p) => p.giftCardType === type)) {
              prices.push({
                giftCardType: type,
                denomination: 100000,
                buyPrice,
                buyRate,
                sellPrice,
                sellRate,
              });
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error crawling woorigiftcard:', error);
  }

  return {
    siteName: '행복상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
