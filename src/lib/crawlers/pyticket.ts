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
    const candidateMap = new Map<PriceInfo['giftCardType'], { buy?: Candidate; sell?: Candidate }>();

    $('tr').each((_, el) => {
      const rowText = $(el).text().replace(/\s+/g, '');
      const special = rowText.includes('<<특가>>');
      if (!rowText.includes('10만원권') || rowText.includes('증정')) return;

      for (const { key, label } of TYPES) {
        if (!rowText.includes(label.replace(/\s+/g, ''))) continue;

        const priceCells = $(el).find('td');
        const buyCell = priceCells.eq(1).text().replace(/\s+/g, '');
        const sellCell = priceCells.eq(2).text().replace(/\s+/g, '');
        const buyMatch = buyCell.match(/([\d,]+)원/);
        const sellMatch = sellCell.match(/([\d,]+)원/);
        if (!buyMatch) continue;

        const buyPrice = parseInt(buyMatch[1].replace(/,/g, ''), 10);
        if (buyPrice <= 0 || buyPrice === BAD_PRICE) return;

        const buyRateMatch = buyCell.match(/\(([\d.]+)%\)/);
        const buyRate = buyRateMatch
          ? parseFloat(buyRateMatch[1])
          : Math.round(((100000 - buyPrice) / 100000) * 10000) / 100;
        const sellPrice = sellMatch ? parseInt(sellMatch[1].replace(/,/g, ''), 10) : undefined;
        const sellRateMatch = sellCell.match(/\(([\d.]+)%\)/);
        const sellRate = sellRateMatch ? parseFloat(sellRateMatch[1]) : undefined;

        const prev = candidateMap.get(key);
        const nextBuy = { price: buyPrice, rate: buyRate, special };
        const nextSell = sellPrice && sellRate ? { price: sellPrice, rate: sellRate, special } : undefined;

        if (!prev || (special && !prev.buy?.special) || (special === prev.buy?.special && buyPrice > (prev.buy?.price || 0))) {
          candidateMap.set(key, { buy: nextBuy, sell: nextSell || prev?.sell });
        } else if (nextSell) {
          candidateMap.set(key, { buy: prev.buy, sell: nextSell });
        }
      }
    });

    for (const { key } of TYPES) {
      const candidate = candidateMap.get(key);
      if (!candidate?.buy) continue;
      prices.push({
        giftCardType: key,
        denomination: 100000,
        buyPrice: candidate.buy.price,
        buyRate: candidate.buy.rate,
        sellPrice: candidate.sell?.price,
        sellRate: candidate.sell?.rate,
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
