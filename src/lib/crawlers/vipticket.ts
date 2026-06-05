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
      // Due to invalid HTML (span directly inside tr), cheerio hoists .makername outside the table
      const titleText = $(table).parent().find('.makername').text().replace(/\s+/g, '');
      let type: PriceInfo['giftCardType'] | null = null;
      
      if (titleText.includes('신세계')) type = 'shinsegae';
      else if (titleText.includes('현대')) type = 'hyundai';
      else if (titleText.includes('롯데')) type = 'lotte';

      if (type && !prices.find(p => p.giftCardType === type)) {
        $(table).find('tbody tr').each((_, tr) => {
          const rowText = $(tr).text().replace(/\s+/g, '');
          if (rowText.includes('10만') && !rowText.includes('증정') && !rowText.includes('제화')) {
            let bestPrice = Infinity;
            let bestRate = 0;
            let foundIche = false;
            
            // Loop through tds and parse
            $(tr).find('td').each((i, td) => {
                const tdText = $(td).text();
                const parsed = parsePriceText(tdText);
                if (parsed && parsed.price > 10000) {
                    // Columns: 0: Name, 1: Buy Cash, 2: Buy Transfer, 3: Sell Cash, 4: Sell Transfer
                    // We only care about buy prices (col 1 and 2). Col 2 is 이체.
                    if (i === 1 || i === 2) {
                        const isIche = (i === 2);
                        if (isIche) {
                            if (!foundIche || parsed.price < bestPrice) {
                                bestPrice = parsed.price;
                                bestRate = parsed.rate;
                                foundIche = true;
                            }
                        } else if (!foundIche && parsed.price < bestPrice) {
                            bestPrice = parsed.price;
                            bestRate = parsed.rate;
                        }
                    }
                }
            });

            if (bestPrice !== Infinity) {
                prices.push({
                    giftCardType: type,
                    denomination: 100000,
                    buyPrice: bestPrice,
                    buyRate: bestRate
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
    siteName: 'VIP상품권',
    siteUrl: 'https://vip상품권.com', // Display url
    timestamp: new Date(),
    prices
  };
}
