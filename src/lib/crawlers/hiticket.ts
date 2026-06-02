import { fetchHtml, parsePriceText } from './helper';
import { CrawlResult, PriceInfo } from '../types';

export async function crawlHiticket(): Promise<CrawlResult> {
  const url = 'http://www.hiticket99.com/html/sub0101.php';
  const $ = await fetchHtml(url);
  const prices: PriceInfo[] = [];

  if ($) {
    $('tr').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ');
      
      // 50만원권 기준으로 10만원권 환산 시세 적용
      if (text.includes('50만원') && !text.includes('증정') && !text.includes('제화')) {
        let type: PriceInfo['giftCardType'] | null = null;
        if (text.includes('신세계')) type = 'shinsegae';
        else if (text.includes('현대')) type = 'hyundai';
        else if (text.includes('롯데')) type = 'lotte';

        if (type) {
          let minPrice = Infinity;
          let minRate = 0;
          $(el).find('td').each((_, td) => {
            const parsed = parsePriceText($(td).text());
            if (parsed && parsed.price > 10000) {
              if (parsed.price < minPrice) {
                minPrice = parsed.price;
                minRate = parsed.rate;
              }
            }
          });

          if (minPrice !== Infinity) {
            // minPrice is for 500,000 won. Normalize to 100,000 won.
            // But wait, the rate is already calculated for 500,000 won.
            // minRate is 3.4%. So buyPrice = 100000 - (100000 * 3.4 / 100)
            const normalizedPrice = 100000 - (100000 * minRate / 100);
            if (!prices.find(p => p.giftCardType === type)) {
              prices.push({
                giftCardType: type,
                denomination: 100000, // Standardized to 10만원
                buyPrice: normalizedPrice,
                buyRate: minRate
              });
            }
          }
        }
      }
    });
  }

  return {
    siteName: '하이티켓',
    siteUrl: url,
    timestamp: new Date(),
    prices
  };
}
