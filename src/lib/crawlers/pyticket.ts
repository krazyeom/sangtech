import { CrawlResult, PriceInfo } from '../types';
import { fetchHtml } from './helper';

const BAD_PRICE = 98000;

type Candidate = {
  price: number;
  rate: number;
  special: boolean;
};

const TYPES = [
  { key: 'lotte' as const, label: '롯데 상품권' },
  { key: 'shinsegae' as const, label: '신세계 상품권' },
  { key: 'hyundai' as const, label: '현대 상품권' },
];

export async function crawlPyTicket(): Promise<CrawlResult> {
  const url = 'https://www.py-ticket.com/';
  const $ = await fetchHtml(url);
  const prices: PriceInfo[] = [];

  if ($) {
    const candidateMap = new Map<PriceInfo['giftCardType'], Candidate>();

    $('tr').each((_, el) => {
      const rowText = $(el).text().replace(/\s+/g, '');
      const special = rowText.includes('<<특가>>');
      if (!rowText.includes('10만원권') || rowText.includes('증정')) return;

      for (const { key, label } of TYPES) {
        if (!rowText.includes(label.replace(/\s+/g, ''))) continue;

        const priceCell = $(el).find('td').eq(1);
        const priceText = priceCell.text().replace(/\s+/g, '');
        const priceMatch = priceText.match(/([\d,]+)원/);
        if (!priceMatch) continue;

        const buyPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        if (buyPrice <= 0 || buyPrice === BAD_PRICE) return;

        const rateMatch = priceText.match(/\(([\d.]+)%\)/);
        const buyRate = rateMatch
          ? parseFloat(rateMatch[1])
          : Math.round(((100000 - buyPrice) / 100000) * 10000) / 100;

        const prev = candidateMap.get(key);
        if (!prev || (special && !prev.special) || (special === prev.special && buyPrice > prev.price)) {
          candidateMap.set(key, { price: buyPrice, rate: buyRate, special });
        }
      }
    });

    for (const { key } of TYPES) {
      const candidate = candidateMap.get(key);
      if (!candidate) continue;
      prices.push({
        giftCardType: key,
        denomination: 100000,
        buyPrice: candidate.price,
        buyRate: candidate.rate,
      });
    }
  }

  return {
    siteName: '풍연상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
