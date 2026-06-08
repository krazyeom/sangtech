import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, PriceInfo } from '../types';

export async function crawlWooh(): Promise<CrawlResult | null> {
  const url = 'https://wooh.co.kr/quote.php';
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const prices: PriceInfo[] = [];

    $('table tbody tr').each((_, el) => {
      const text = $(el).find('.sct_txt a').text().trim();
      if (!text) return;

      const normalizedText = text.replace(/\s+/g, '');
      const hasTenK = normalizedText.includes('10만');
      
      if (hasTenK && !normalizedText.includes('증정') && !normalizedText.includes('제화')) {
        let type: PriceInfo['giftCardType'] | null = null;
        if (normalizedText.includes('신세계')) type = 'shinsegae';
        else if (normalizedText.includes('현대')) type = 'hyundai';
        else if (normalizedText.includes('롯데')) type = 'lotte';

        if (type && !prices.find(p => p.giftCardType === type)) {
          const tds = $(el).find('td');
          if (tds.length >= 3) {
             const buyPriceText = $(tds[1]).text().trim();
             const match = buyPriceText.match(/([\d,]+)\s*원?/);
             if (match) {
                 const buyPrice = parseInt(match[1].replace(/,/g, ''), 10);
                 if (buyPrice > 0 && buyPrice <= 100000) {
                     const buyRate = Math.round(((100000 - buyPrice) / 100000) * 100 * 100) / 100;
                     prices.push({
                         giftCardType: type,
                         denomination: 100000,
                         buyPrice,
                         buyRate
                     });
                 }
             }
          }
        }
      }
    });

    return {
      siteName: '우현상품권',
      siteUrl: 'https://wooh.co.kr/',
      timestamp: new Date(),
      prices,
    };
  } catch (error) {
    console.error(`Error fetching wooh:`, error);
    return null;
  }
}
