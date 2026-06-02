import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

export async function fetchHtml(url: string, encoding: string = 'utf-8') {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });
    
    // Convert encoding if needed
    const html = iconv.decode(response.data, encoding);
    return cheerio.load(html);
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

export function parsePriceText(text: string): { price: number, rate: number } | null {
  // 예: "96,500원 (3.5%)" 또는 "96,500원(3.5%)" 또는 "96,550원 (3.45%) 이체"
  const match = text.match(/([\d,]+)원?\s*\(([\d.]+)%\)/);
  if (match) {
    return {
      price: parseInt(match[1].replace(/,/g, ''), 10),
      rate: parseFloat(match[2]),
    };
  }
  return null;
}

export async function crawlGeneric(siteName: string, url: string, encoding = 'utf-8'): Promise<import('../types').CrawlResult | null> {
  const $ = await fetchHtml(url, encoding);
  if (!$) return null;

  const prices: import('../types').PriceInfo[] = [];

  $('tr').each((_, el) => {
    let text = $(el).text().trim();
    
    // input _item 속성이 있으면 텍스트에 추가
    const input = $(el).find('input');
    if (input.length > 0) {
      const itemAttr = input.attr('_item');
      if (itemAttr) {
        text += ' ' + itemAttr;
      }
    }

    // 10만원권, 10만, 10 만원권 등 매칭
    if (text.includes('10만') && !text.includes('증정') && !text.includes('제화')) {
      let type: import('../types').PriceInfo['giftCardType'] | null = null;
      if (text.includes('신세계')) type = 'shinsegae';
      else if (text.includes('현대')) type = 'hyundai';
      else if (text.includes('롯데')) type = 'lotte';

      if (type) {
        let buyPrice = 0;
        let buyRate = 0;

        // 우선 input 속성에서 찾기
        if (input.length > 0) {
           const amt1 = input.attr('_amt1');
           if (amt1) {
              buyPrice = parseInt(amt1);
              buyRate = Math.round(((100000 - buyPrice) / 100000) * 100 * 100) / 100;
           }
        }

        // 텍스트에서 찾기
        if (buyPrice === 0) {
           let minPrice = Infinity;
           let minRate = 0;
           $(el).find('td').each((_, td) => {
               const parsed = parsePriceText($(td).text());
               // 매입가와 판매가가 둘 다 있을 경우, 상점이 사들이는 매입가(더 낮은 가격)를 선택
               if (parsed && parsed.price > 10000) {
                   if (parsed.price < minPrice) {
                       minPrice = parsed.price;
                       minRate = parsed.rate;
                   }
               }
           });
           if (minPrice !== Infinity) {
               buyPrice = minPrice;
               buyRate = minRate;
           }
        }

        if (buyPrice > 0) {
           if (!prices.find(p => p.giftCardType === type)) {
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
  });

  return {
    siteName,
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
