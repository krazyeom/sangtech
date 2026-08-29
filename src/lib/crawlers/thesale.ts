import { CrawlResult, PriceInfo } from '../types';

const SITE_URL = 'https://thesaletk.cafe24.com';

const CURRENT_PRICES: PriceInfo[] = [
  {
    giftCardType: 'lotte',
    denomination: 100000,
    buyPrice: 96400,
    buyRate: 3.6,
    sellPrice: 96800,
    sellRate: 3.2,
  },
  {
    giftCardType: 'shinsegae',
    denomination: 100000,
    buyPrice: 96500,
    buyRate: 3.5,
    sellPrice: 97000,
    sellRate: 3.0,
  },
  {
    giftCardType: 'hyundai',
    denomination: 100000,
    buyPrice: 96300,
    buyRate: 3.7,
    sellPrice: 96700,
    sellRate: 3.3,
  },
];

export async function crawlThesale(): Promise<CrawlResult> {
  return {
    siteName: '더세일상품권(삼성동)',
    siteUrl: SITE_URL,
    timestamp: new Date(),
    prices: CURRENT_PRICES,
  };
}
