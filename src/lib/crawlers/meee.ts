import axios from 'axios';
import { CrawlResult, PriceInfo } from '../types';

const TYPE_RULES: Array<{ type: PriceInfo['giftCardType']; label: string }> = [
  { type: 'lotte', label: '롯데상품권' },
  { type: 'shinsegae', label: '신세계상품권' },
  { type: 'hyundai', label: '현대상품권' },
];

const ROW_RE = /<tr data-num='(\d+)' class="">([\s\S]*?)<\/tr>/g;
const TD_RE = /<td class="(tit|price|price2)">([\s\S]*?)<\/td>/g;

function clean(text: string) {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function parsePrice(text: string): { price: number; rate: number } | null {
  const match = text.match(/([\d,]+)원\(([-\d.]+)%\)/);
  if (!match) return null;
  return {
    price: parseInt(match[1].replace(/,/g, ''), 10),
    rate: parseFloat(match[2]),
  };
}

export async function crawlMeee(): Promise<CrawlResult> {
  const url = 'https://meee.co.kr/';
  const html = (await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 15000,
  })).data as string;

  const prices: PriceInfo[] = [];

  for (const { type, label } of TYPE_RULES) {
    ROW_RE.lastIndex = 0;
    let matched = false;
    for (const rowMatch of html.matchAll(ROW_RE)) {
      const body = rowMatch[2];
      const cells = [...body.matchAll(TD_RE)].map((m) => clean(m[2]));
      const title = cells.find((c) => c);
      if (!title || title.includes('현금') || title.includes('사은증정') || title.includes('증정')) continue;
      if (!title.includes(label)) continue;

      const buy = parsePrice(cells[1] || '');
      const sell = parsePrice(cells[2] || '');
      if (!buy || !sell) continue;

      prices.push({
        giftCardType: type,
        denomination: 100000,
        buyPrice: buy.price,
        buyRate: buy.rate,
        sellPrice: sell.price,
        sellRate: sell.rate,
      });
      matched = true;
      break;
    }
    if (!matched) {
      console.warn(`Meee crawler missed ${label}`);
    }
  }

  return {
    siteName: '미래상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}

export default { crawlMeee };
