import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, PriceInfo } from '../types';
import { parsePriceText } from './helper';

export async function crawlCitypay(): Promise<CrawlResult> {
  const url = 'https://city-pay.co.kr';
  const prices: PriceInfo[] = [];

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // city-pay places multiple cards in the same TR, so we should search td by td
    $('td').each((_, td) => {
      const text = $(td).text().replace(/\s+/g, '');
      
      // Look for a cell that has the gift card name and '10만원권'
      let type: PriceInfo['giftCardType'] | null = null;
      if (text.includes('신세계백화점10만원권') && !text.includes('증정')) type = 'shinsegae';
      else if (text.includes('현대백화점10만원권') && !text.includes('증정')) type = 'hyundai';
      else if (text.includes('롯데백화점10만원권') && !text.includes('증정')) type = 'lotte';

      if (type) {
        // The price is usually in the next few tds
        // Let's grab the next sibling td
        const nextTd = $(td).next('td');
        const nextNextTd = nextTd.next('td');
        
        let bestPrice = Infinity;
        let bestRate = 0;
        let foundIche = false;
        
        const extractFromTd = (el: cheerio.Cheerio<any>) => {
            const tdText = el.text();
            const matches = Array.from(tdText.matchAll(/([\d,]+)\s*원?\s*\(([\d.]+)\s*%\)\s*(이체|현금)?/g));
            if (matches.length > 0) {
                for (const match of matches) {
                    const price = parseInt(match[1].replace(/,/g, ''), 10);
                    const rate = parseFloat(match[2]);
                    const kind = match[3];
                    if (price > 10000) {
                        if (kind === '이체') {
                            if (!foundIche || price > bestPrice) {
                                bestPrice = price;
                                bestRate = rate;
                                foundIche = true;
                            }
                        } else if (!foundIche && (bestPrice === Infinity || price > bestPrice)) {
                            bestPrice = price;
                            bestRate = rate;
                        }
                    }
                }
            } else {
                const parsed = parsePriceText(tdText);
                if (parsed && parsed.price > 10000 && !foundIche) {
                    if (parsed.price < bestPrice) {
                        bestPrice = parsed.price;
                        bestRate = parsed.rate;
                    }
                }
            }
        };

        extractFromTd(nextTd);
        extractFromTd(nextNextTd);

        if (bestPrice !== Infinity && !prices.find(p => p.giftCardType === type)) {
          prices.push({
            giftCardType: type,
            denomination: 100000,
            buyPrice: bestPrice,
            buyRate: bestRate,
          });
        }
      }
    });

  } catch (error) {
    console.error('Error crawling citypay:', error);
  }

  return {
    siteName: '씨티상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
