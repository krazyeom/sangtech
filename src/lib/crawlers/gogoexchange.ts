import { fetchHtml } from './helper';
import { CrawlResult } from '../types';

export async function crawlGogoExchange(): Promise<CrawlResult> {
  const url = 'https://www.gogoexchange.co.kr';
  const $ = await fetchHtml(url);
  const prices: import('../types').PriceInfo[] = [];

  if ($) {
    const bodyText = $('body').text();
    const discountMatch = bodyText.match(/1만 원권\s*:\s*([\d.]+)%\s*할인/);
    if (discountMatch) {
      const discount = parseFloat(discountMatch[1]);
      const buyRate = discount;
      const buyPrice = 100000 - (100000 * (discount / 100));

      ['shinsegae', 'lotte', 'hyundai'].forEach(type => {
        prices.push({
          giftCardType: type as any,
          denomination: 100000,
          buyPrice,
          buyRate
        });
      });
    }
  }

  return {
    siteName: '고고상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices
  };
}
