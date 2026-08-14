import { CrawlResult, PriceInfo } from '../types';
import { fetchHtml, parsePriceText } from './helper';

export async function crawlChoigoTicket(): Promise<CrawlResult | null> {
  const url = 'https://www.choigoticket.com';
  const $ = await fetchHtml(url);
  if (!$) return null;

  const prices: PriceInfo[] = [];

  $('tr').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('10만') && !text.includes('증정') && !text.includes('제화')) {
      let type: PriceInfo['giftCardType'] | null = null;
      if (text.includes('신세계')) type = 'shinsegae';
      else if (text.includes('현대')) type = 'hyundai';
      else if (text.includes('롯데')) type = 'lotte';

      if (type) {
        const input = $(el).find('input.qty');
        let buyPrice = 0;
        let buyRate = 0;
        let sellPrice = 0;
        let sellRate = 0;

        if (input.length > 0) {
          const amt1 = input.attr('_amt1');
          const amt2 = input.attr('_amt2');
          if (amt1) {
            buyPrice = parseInt(amt1, 10);
            buyRate = Math.round(((100000 - buyPrice) / 100000) * 100 * 100) / 100;
          }
          if (amt2) {
            sellPrice = parseInt(amt2, 10);
            sellRate = Math.round(((100000 - sellPrice) / 100000) * 100 * 100) / 100;
          }
        }

        if (buyPrice === 0 || sellPrice === 0) {
          $(el).find('td').each((idx, td) => {
            const parsed = parsePriceText($(td).text());
            if (!parsed || parsed.price <= 10000) return;
            if (idx === 1 && buyPrice === 0) {
              buyPrice = parsed.price;
              buyRate = parsed.rate;
            }
            if (idx === 2 && sellPrice === 0) {
              sellPrice = parsed.price;
              sellRate = parsed.rate;
            }
          });
        }

        if (buyPrice > 0) {
          const existing = prices.find((p) => p.giftCardType === type);
          if (!existing) {
            prices.push({
              giftCardType: type,
              denomination: 100000,
              buyPrice,
              buyRate,
              sellPrice: sellPrice > 0 ? sellPrice : undefined,
              sellRate: sellRate > 0 ? sellRate : undefined,
            });
          }
        }
      }
    }
  });

  return {
    siteName: '최고상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
