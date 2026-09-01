import { CrawlResult, PriceInfo } from '../types';
import axios from 'axios';

export async function crawlUticket(): Promise<CrawlResult | null> {
  const url = 'https://uticket.kr/';
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    const html = response.data;
    const marker = '\\"giftCards\\":[';
    const markerIndex = html.indexOf(marker);
    if (markerIndex === -1) return null;

    const start = html.indexOf('[', markerIndex);
    if (start === -1) return null;

    let bracketCount = 0;
    let end = -1;
    for (let i = start; i < html.length; i++) {
      if (html[i] === '[') bracketCount++;
      else if (html[i] === ']') bracketCount--;
      if (bracketCount === 0) {
        end = i + 1;
        break;
      }
    }

    if (end === -1) return null;

    let giftCards;
    try {
      const jsonStr = html
        .substring(start, end)
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
      giftCards = JSON.parse(jsonStr);
    } catch (err) {
      console.error('Uticket JSON parse error:', err);
      return null;
    }

    const prices: PriceInfo[] = [];

    for (const card of giftCards) {
      if (card.faceValue === 100000 && card.type === 'PAPER') {
        let type: PriceInfo['giftCardType'] | null = null;
        if (card.name.includes('신세계')) type = 'shinsegae';
        else if (card.name.includes('현대')) type = 'hyundai';
        else if (card.name.includes('롯데')) type = 'lotte';

        if (type) {
          const buyPrice = card.buyPriceBank > 0 ? card.buyPriceBank : card.buyPrice;
          // 판매가는 고객이 살 때 기준이므로 현금가를 우선 사용한다.
          const sellPrice = card.sellPrice > 0 ? card.sellPrice : card.sellPriceBank;
          if (buyPrice > 0) {
            const buyRate = Math.round(((100000 - buyPrice) / 100000) * 100 * 100) / 100;
            const sellRate = sellPrice > 0 ? Math.round(((100000 - sellPrice) / 100000) * 100 * 100) / 100 : undefined;
            prices.push({
              giftCardType: type,
              denomination: 100000,
              buyPrice,
              buyRate,
              sellPrice: sellPrice > 0 ? sellPrice : undefined,
              sellRate,
            });
          }
        }
      }
    }

    return {
      siteName: '의리상품권',
      siteUrl: url,
      timestamp: new Date(),
      prices,
    };
  } catch (error) {
    console.error(`Error fetching uticket:`, error);
    return null;
  }
}
