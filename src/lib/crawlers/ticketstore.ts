import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, PriceInfo } from '../types';

export async function crawlTicketstore(): Promise<CrawlResult> {
  const url = 'https://www.ticketstore.co.kr/';
  const prices: PriceInfo[] = [];

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    $('#pclist tbody tr').each((_, tr) => {
      const productName = $(tr).find('.product-name').text().replace(/\s+/g, '');
      if (!productName) return;

      let type: PriceInfo['giftCardType'] | null = null;
      if (productName.includes('신세계')) type = 'shinsegae';
      else if (productName.includes('현대')) type = 'hyundai';
      else if (productName.includes('롯데')) type = 'lotte';

      if (type && productName.includes('10만') && !productName.includes('카드') && !productName.includes('품절')) {
        const wholesaleText = $(tr).find('.price-wholesale').first().text().replace(/[^\d]/g, '');
        if (wholesaleText) {
          const buyPrice = parseInt(wholesaleText, 10);
          if (buyPrice > 10000 && buyPrice <= 100000) {
            const buyRate = Math.round(((100000 - buyPrice) / 100000) * 100 * 100) / 100;
            if (!prices.find(p => p.giftCardType === type)) {
              prices.push({
                giftCardType: type,
                denomination: 100000,
                buyPrice,
                buyRate
              });
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error crawling ticketstore:', error);
  }

  return {
    siteName: '맥스솔루션(안양)',
    siteUrl: url,
    timestamp: new Date(),
    prices
  };
}
