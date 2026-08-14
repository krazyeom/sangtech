import axios from 'axios';
import { CrawlResult, PriceInfo } from '../types';

export async function crawlDream(): Promise<CrawlResult> {
  const apiUrl = 'https://dream.phaze2-api.com/pricing/board';
  const displayUrl = 'https://드림상품권.com';
  const prices: PriceInfo[] = [];

  try {
    const { data } = await axios.get(apiUrl);

    if (data && Array.isArray(data.products)) {
      for (const item of data.products) {
        if (item.amount === 100000) {
          let type: PriceInfo['giftCardType'] | null = null;

          if (item.brandKey === 'sinsegae') type = 'shinsegae';
          else if (item.brandKey === 'hyundai') type = 'hyundai';
          else if (item.brandKey === 'lotte') type = 'lotte';

          if (type) {
            const buyTransfer = item.buy?.transfer;
            const buyCash = item.buy?.cash;
            const sellPriceInfo = item.sell;

            let buyPrice = 0;
            let buyRate = 0;
            let sellPrice = 0;
            let sellRate = 0;

            if (buyTransfer && typeof buyTransfer.price === 'number') {
              buyPrice = buyTransfer.price;
              buyRate = buyTransfer.discountRate || 0;
            } else if (buyCash && typeof buyCash.price === 'number') {
              buyPrice = buyCash.price;
              buyRate = buyCash.discountRate || 0;
            }

            if (sellPriceInfo && typeof sellPriceInfo.price === 'number') {
              sellPrice = sellPriceInfo.price;
              sellRate = sellPriceInfo.discountRate || 0;
            }

            if (buyPrice > 0 && !prices.find((p) => p.giftCardType === type)) {
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
    }
  } catch (error) {
    console.error('Error crawling dream:', error);
  }

  return {
    siteName: '드림상품권',
    siteUrl: displayUrl,
    timestamp: new Date(),
    prices
  };
}
