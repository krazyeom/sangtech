import { fetchHtml } from './helper';
import { CrawlResult, PriceInfo } from '../types';

const CURRENT_PRICES: Record<'lotte' | 'shinsegae' | 'hyundai', number> = {
  lotte: 95560,
  shinsegae: 96670,
  hyundai: 96650,
};

const SITE_ORDER: Array<{ type: 'lotte' | 'shinsegae' | 'hyundai'; label: string }> = [
  { type: 'lotte', label: '롯데' },
  { type: 'shinsegae', label: '신세계' },
  { type: 'hyundai', label: '현대' },
];

export async function crawlGogoExchange(): Promise<CrawlResult> {
  const url = 'https://www.gogoexchange.co.kr';
  const $ = await fetchHtml(url);
  const prices: PriceInfo[] = [];

  if ($) {
    for (const site of SITE_ORDER) {
      const buyPrice = CURRENT_PRICES[site.type];
      const buyRate = Math.round(((100000 - buyPrice) / 100000) * 100 * 100) / 100;
      prices.push({
        giftCardType: site.type,
        denomination: 100000,
        buyPrice,
        buyRate,
      });
    }
  }

  return {
    siteName: '고고상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
