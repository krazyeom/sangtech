import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, PriceInfo } from '../types';

const SITE_URL = 'https://thesaletk.cafe24.com';

const parseMoneyValues = (text: string) => {
  const match = text.match(/([\d,]+)(?:\s*~\s*([\d,]+))?/);
  if (!match) return [];
  return [match[1], match[2]]
    .filter(Boolean)
    .map((value) => parseInt(value.replace(/,/g, ''), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
};

const parseRate = (text: string) => {
  const match = text.match(/([\d.]+)\s*%/);
  return match ? parseFloat(match[1]) : 0;
};

const normalizeRowPrice = (values: number[], side: 'buy' | 'sell') => {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  return side === 'buy' ? values[0] : values[values.length - 1];
};

export async function crawlThesale(): Promise<CrawlResult> {
  const prices: PriceInfo[] = [];

  try {
    const { data: html } = await axios.get(SITE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);
    const table = $('table.gift-table').first();

    table.find('tr').each((_, tr) => {
      const cells = $(tr).find('td');
      if (cells.length < 3) return;

      const brandText = $(cells[0]).text().replace(/\s+/g, '');
      if (brandText.includes('모바일')) return;
      const buyText = $(cells[1]).text().replace(/\s+/g, ' ');
      const sellText = $(cells[2]).text().replace(/\s+/g, ' ');

      let type: PriceInfo['giftCardType'] | null = null;
      if (brandText.includes('롯데')) type = 'lotte';
      else if (brandText.includes('신세계')) type = 'shinsegae';
      else if (brandText.includes('현대')) type = 'hyundai';
      if (!type) return;

      const buyValues = parseMoneyValues(buyText);
      const sellValues = parseMoneyValues(sellText);
      const buyPrice = normalizeRowPrice(buyValues, 'buy');
      const sellPrice = normalizeRowPrice(sellValues, 'sell');
      const buyRate = parseRate(buyText) || (buyPrice > 0 ? Math.round(((100000 - buyPrice) / 100000) * 10000) / 100 : 0);
      const sellRate = parseRate(sellText) || (sellPrice > 0 ? Math.round(((100000 - sellPrice) / 100000) * 10000) / 100 : 0);

      if (buyPrice > 0) {
        prices.push({
          giftCardType: type,
          denomination: 100000,
          buyPrice,
          buyRate,
          sellPrice: sellPrice > 0 ? sellPrice : undefined,
          sellRate: sellPrice > 0 ? sellRate : undefined,
        });
      }
    });
  } catch (error) {
    console.error('Error crawling 더세일상품권:', error);
  }

  return {
    siteName: '더세일상품권(삼성)',
    siteUrl: SITE_URL,
    timestamp: new Date(),
    prices,
  };
}
