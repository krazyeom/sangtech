import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, PriceInfo } from '../types';

export async function crawlCitypay(): Promise<CrawlResult> {
  const url = 'https://city-pay.co.kr';
  const prices: PriceInfo[] = [];

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    $('td').each((_, td) => {
      const text = $(td).text().replace(/\s+/g, '');

      let type: PriceInfo['giftCardType'] | null = null;
      if (text.includes('신세계백화점10만원권') && !text.includes('증정')) type = 'shinsegae';
      else if (text.includes('현대백화점10만원권') && !text.includes('증정')) type = 'hyundai';
      else if (text.includes('롯데백화점10만원권') && !text.includes('증정')) type = 'lotte';

      if (type) {
        const row = $(td).parent('tr');
        const tds = row.find('td');
        const buyText = $(tds[1]).text().replace(/\s+/g, '');
        const sellText = $(tds[2]).text().replace(/\s+/g, '');

        const buyCandidates = Array.from(buyText.matchAll(/([\d,]+)\s*원?\s*\(([\d.]+)\s*%\)/g))
          .map((match) => ({ price: parseInt(match[1].replace(/,/g, ''), 10), rate: parseFloat(match[2]) }))
          .filter((entry) => Number.isFinite(entry.price) && entry.price > 10000);
        const buyCandidate = buyCandidates.reduce<{ price: number; rate: number } | null>((best, current) => (best && best.price > current.price ? best : current), null);

        const sellMatch = sellText.match(/([\d,]+)\s*원?\s*\(([\d.]+)\s*%\)/);
        const sellCandidate = sellMatch
          ? { price: parseInt(sellMatch[1].replace(/,/g, ''), 10), rate: parseFloat(sellMatch[2]) }
          : null;

        if (buyCandidate && !prices.find((p) => p.giftCardType === type)) {
          prices.push({
            giftCardType: type,
            denomination: 100000,
            buyPrice: buyCandidate.price,
            buyRate: buyCandidate.rate,
            sellPrice: sellCandidate?.price,
            sellRate: sellCandidate?.rate,
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
