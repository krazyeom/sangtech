import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, PriceInfo } from '../types';
import { parsePriceText } from './helper';

export async function crawlVipticket(): Promise<CrawlResult> {
  const url = 'https://xn--vip-7w8li28e7j0a.com/main/main.html';
  const prices: PriceInfo[] = [];

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    $('table.type11').each((_, table) => {
      const titleText = $(table).parent().find('.makername').text().replace(/\s+/g, '');
      let type: PriceInfo['giftCardType'] | null = null;

      if (titleText.includes('신세계')) type = 'shinsegae';
      else if (titleText.includes('현대')) type = 'hyundai';
      else if (titleText.includes('롯데')) type = 'lotte';

      if (type && !prices.find((p) => p.giftCardType === type)) {
        $(table).find('tbody tr').each((_, tr) => {
          const rowText = $(tr).text().replace(/\s+/g, '');
          if (!rowText.includes('10만') || rowText.includes('증정') || rowText.includes('제화')) return;

          const tds = $(tr).find('td');
          if (tds.length >= 5) {
            const buyTransfer = parsePriceText($(tds[1]).text());
            const buyCash = parsePriceText($(tds[2]).text());
            const sellTransfer = parsePriceText($(tds[3]).text());
            const sellCash = parsePriceText($(tds[4]).text());

            const buyCandidate = [buyTransfer, buyCash]
              .filter(Boolean)
              .reduce<{ price: number; rate: number } | null>((best, current) => (!best || current!.price > best.price ? current! : best), null);
            const sellCandidate = [sellTransfer, sellCash]
              .filter(Boolean)
              .reduce<{ price: number; rate: number } | null>((best, current) => (!best || current!.price > best.price ? current! : best), null);

            if (buyCandidate) {
              prices.push({
                giftCardType: type,
                denomination: 100000,
                buyPrice: buyCandidate.price,
                buyRate: buyCandidate.rate,
                sellPrice: sellCandidate?.price,
                sellRate: sellCandidate?.rate,
              });
            }
          }
        });
      }
    });

  } catch (error) {
    console.error('Error crawling vipticket:', error);
  }

  return {
    siteName: 'VIP상품권(잠실)',
    siteUrl: 'https://vip상품권.com',
    timestamp: new Date(),
    prices
  };
}
