import { fetchHtml, extractPriceCandidates, pickPreferredCandidate } from './helper';
import { CrawlResult, PriceInfo } from '../types';

const TARGET_SITES = [
  { label: '롯데 백화점 상품권', type: 'lotte' as const },
  { label: '신세계 백화점 상품권', type: 'shinsegae' as const },
  { label: '현대 백화점 상품권', type: 'hyundai' as const },
];

export async function crawlGogoExchange(): Promise<CrawlResult> {
  const url = 'https://www.gogoexchange.co.kr';
  const $ = await fetchHtml(url);
  const prices: PriceInfo[] = [];

  if ($) {
    $('tr').each((_, el) => {
      const rowText = $(el).text().replace(/\s+/g, '');
      const target = TARGET_SITES.find(({ label }) => rowText.includes(label.replace(/\s+/g, '')));

      if (!target) return;
      if (rowText.includes('증정') || rowText.includes('제화')) return;

      const priceCell = $(el).find('td').eq(1);
      if (!priceCell.length) return;

      const preferred = pickPreferredCandidate(
        extractPriceCandidates(priceCell.text()).filter(
          (candidate) => candidate.price > 10000 && candidate.price <= 100000
        )
      );

      if (!preferred) return;
      if (prices.find((p) => p.giftCardType === target.type)) return;

      prices.push({
        giftCardType: target.type,
        denomination: 100000,
        buyPrice: preferred.price,
        buyRate: preferred.rate,
      });
    });
  }

  return {
    siteName: '고고상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
