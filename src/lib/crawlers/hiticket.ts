import { fetchHtml, parsePriceText } from './helper';
import { CrawlResult, PriceInfo } from '../types';

export async function crawlHiticket(): Promise<CrawlResult> {
  const url = 'http://www.hiticket99.com/html/sub0101.php';
  const $ = await fetchHtml(url);
  const prices: PriceInfo[] = [];

  if ($) {
    let currentType: PriceInfo['giftCardType'] | null = null;

    $('tr').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ');

      if (text.includes('롯데 상품권(증정용)') || text.includes('신세계 상품권(증정용)') || text.includes('현대 상품권(증정용)')) {
        return;
      }

      if (text.includes('롯데 상품권') && text.includes('50만원')) currentType = 'lotte';
      else if (text.includes('신세계 상품권') && text.includes('50만원')) currentType = 'shinsegae';
      else if (text.includes('현대 상품권') && text.includes('50만원')) currentType = 'hyundai';
      else if (text.includes('국민관광 상품권')) currentType = null;

      const isTenKRow = text.includes('10만원') || text.includes('10만') || text.includes('10留');
      if (!isTenKRow || text.includes('증정') || text.includes('제화')) return;

      let type: PriceInfo['giftCardType'] | null = null;
      if (text.includes('롯데')) type = 'lotte';
      else if (text.includes('신세계')) type = 'shinsegae';
      else if (text.includes('현대')) type = 'hyundai';
      else if (currentType) type = currentType;

      if (type) {
        const pricesFound = Array.from(text.matchAll(/([\d,]+)원\s*\(([-\d.]+)%\)/g));
        if (pricesFound.length >= 1) {
          const buyPrice = parseInt(pricesFound[0][1].replace(/,/g, ''), 10);
          const buyRate = parseFloat(pricesFound[0][2]);
          const sellPrice = pricesFound[1] ? parseInt(pricesFound[1][1].replace(/,/g, ''), 10) : undefined;
          const sellRate = pricesFound[1] ? parseFloat(pricesFound[1][2]) : undefined;

          if (buyPrice > 0) {
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
    });
  }

  return {
    siteName: '하이티켓',
    siteUrl: url,
    timestamp: new Date(),
    prices
  };
}
