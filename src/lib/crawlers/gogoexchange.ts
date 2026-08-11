import { fetchHtml, extractPriceCandidates, pickPreferredCandidate } from './helper';
import { CrawlResult, PriceInfo } from '../types';

const TARGET_SITES = [
  { label: '롯데', type: 'lotte' as const },
  { label: '신세계', type: 'shinsegae' as const },
  { label: '현대', type: 'hyundai' as const },
];

const isTargetRow = (rowText: string, label: string) => {
  const normalized = rowText.replace(/\s+/g, '');
  return normalized.includes(label) && /10\s*만원/.test(rowText);
};

export async function crawlGogoExchange(): Promise<CrawlResult> {
  const url = 'https://www.gogoexchange.co.kr';
  const $ = await fetchHtml(url);
  const prices: PriceInfo[] = [];

  if ($) {
    $('tr').each((_, el) => {
      const rowText = $(el).text();
      const normalizedRowText = rowText.replace(/\s+/g, '');
      const target = TARGET_SITES.find(({ label }) => isTargetRow(normalizedRowText, label));

      if (!target) return;
      if (normalizedRowText.includes('주유') || normalizedRowText.includes('제화')) return;

      const priceCell = $(el).find('td').eq(1);
      if (!priceCell.length) return;

      const preferred = pickPreferredCandidate(
        extractPriceCandidates(priceCell.text()).filter(
          (candidate) => candidate.price > 10000 && candidate.price <= 100000
        )
      );

      if (!preferred) return;

      const existing = prices.find((p) => p.giftCardType === target.type);
      if (!existing || preferred.price > existing.buyPrice) {
        if (!existing) {
          prices.push({
            giftCardType: target.type,
            denomination: 100000,
            buyPrice: preferred.price,
            buyRate: preferred.rate,
          });
        } else {
          existing.buyPrice = preferred.price;
          existing.buyRate = preferred.rate;
        }
      }
    });
  }

  return {
    siteName: '고고상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
