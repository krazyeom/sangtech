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
  // 예: "96,500원 (3.5%)" 또는 "96,500원(3.5%)" 또는 "96,900 원 (3.1%)"
  const match = text.match(/([\d,]+)\s*원?\s*\(([\d.]+)\s*%\)/);
  if (match) {
    return {
      price: parseInt(match[1].replace(/,/g, ''), 10),
      rate: parseFloat(match[2]),
    };
  }
  return null;
}

export async function crawlGeneric(
  url: string,
  siteName: string,
  options: {
    encoding?: string;
    selector?: string;
    bypassTenKCheck?: boolean;
  } = {}
): Promise<import('../types').CrawlResult> {
  const prices: import('../types').PriceInfo[] = [];

  try {
    let html = '';
    
    if (options.encoding === 'euc-kr') {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      html = iconv.decode(response.data, 'euc-kr');
    } else {
      const response = await axios.get(url);
      html = response.data;
    }

    const $ = cheerio.load(html);
    const selector = options.selector || 'tr';

    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      const input = $(el).find('input');

      let buyPrice = 0;
      let buyRate = 0;

      // 우선 input 속성에서 찾기 (그누보드 형태)
      if (input.length > 0) {
         const amt1 = input.attr('_amt1');
         const itemAttr = input.attr('_item') || '';
         if (amt1 && !itemAttr.includes('증정') && !itemAttr.includes('제화')) {
            buyPrice = parseInt(amt1);
            buyRate = Math.round(((100000 - buyPrice) / 100000) * 100 * 100) / 100;
         }
      }

      // 10만원권, 10만, 10 만원권, 50/10/5만원 등 매칭 (또는 강제 패스 옵션)
      const normalizedText = text.replace(/\s+/g, '');
      const hasTenK = normalizedText.includes('10만') || normalizedText.includes('/10/') || options.bypassTenKCheck;
      
      if (hasTenK && !normalizedText.includes('증정') && !normalizedText.includes('제화') && !normalizedText.includes('주유') && !normalizedText.includes('오일') && !normalizedText.includes('관광')) {
        let type: import('../types').PriceInfo['giftCardType'] | null = null;
        if (normalizedText.includes('신세계')) type = 'shinsegae';
        else if (normalizedText.includes('현대')) type = 'hyundai';
        else if (normalizedText.includes('롯데')) type = 'lotte';

        if (type) {
          // 텍스트에서 찾기
          if (buyPrice === 0) {
             let bestPrice = Infinity;
             let bestRate = 0;
             let foundIche = false;
             
             let bestPriceInFirstTd = 0;
             let bestRateInFirstTd = 0;
             let foundPriceColumn = false;
             
             $(el).find('td').each((_, td) => {
                 if (foundPriceColumn) return;
                 
                 const tdText = $(td).text();
                 let localPrices: { price: number, rate: number }[] = [];
                 
                 const matches = Array.from(tdText.matchAll(/([\d,]+)\s*원?\s*\(([\d.]+)\s*%\)/g));
                 if (matches.length > 0) {
                     for (const match of matches) {
                         localPrices.push({
                             price: parseInt(match[1].replace(/,/g, ''), 10),
                             rate: parseFloat(match[2])
                         });
                     }
                 } else {
                     const pctMatches = Array.from(tdText.matchAll(/([\d.]+)\s*%\s*(?:\([^)]+\))?/g));
                     if (pctMatches.length > 0) {
                         for (const m of pctMatches) {
                             const rate = parseFloat(m[1]);
                             // If a site only lists % (e.g. 3.3%), price is 100k - (100k * 3.3 / 100) = 96700
                             const price = 100000 - (100000 * rate / 100);
                             localPrices.push({ price, rate });
                         }
                     } else {
                         const parsed = parsePriceText(tdText);
                         if (parsed) localPrices.push(parsed);
                     }
                 }
                 
                 if (localPrices.length > 0) {
                     foundPriceColumn = true; // Stop searching subsequent tds in this row
                     for (const p of localPrices) {
                         if (p.price > 10000 && p.price <= 100000) {
                             if (p.price > bestPriceInFirstTd) {
                                 bestPriceInFirstTd = p.price;
                                 bestRateInFirstTd = p.rate;
                             }
                         }
                     }
                 }
             });
             
             if (bestPriceInFirstTd > 0) {
                 buyPrice = bestPriceInFirstTd;
                 buyRate = bestRateInFirstTd;
             }
          }

          if (buyPrice > 0) {
             const existing = prices.find(p => p.giftCardType === type);
             if (!existing) {
                prices.push({
                   giftCardType: type,
                   denomination: 100000,
                   buyPrice,
                   buyRate
                });
             } else if (buyPrice > existing.buyPrice) {
                existing.buyPrice = buyPrice;
                existing.buyRate = buyRate;
             }
          }
        }
      }
    });

    // h4와 ul.ul-sell 패턴 추가 매칭 (마이페이의 현대상품권 등 tr 테이블에서 누락된 항목 보완)
    $('h4').each((_, el) => {
      const text = $(el).text().trim();
      const normalizedText = text.replace(/\s+/g, '');
      if ((normalizedText.includes('10만') || normalizedText.includes('/10/')) && !normalizedText.includes('증정') && !normalizedText.includes('제화') && !normalizedText.includes('주유') && !normalizedText.includes('오일') && !normalizedText.includes('관광')) {
        let type: import('../types').PriceInfo['giftCardType'] | null = null;
        if (normalizedText.includes('신세계')) type = 'shinsegae';
        else if (normalizedText.includes('현대')) type = 'hyundai';
        else if (normalizedText.includes('롯데')) type = 'lotte';

        if (type && !prices.find(p => p.giftCardType === type)) {
          const container = $(el).parent();
          const ul = container.find('ul.ul-sell');
          if (ul.length > 0) {
             let bestPrice = Infinity;
             let bestRate = 0;
             let foundRemittance = false;
             
             ul.find('li').each((_, li) => {
                 const priceAttr = $(li).attr('data-price');
                 const rateAttr = $(li).attr('data-rate');
                 const methodAttr = $(li).attr('data-method');
                 const liText = $(li).text();
                 
                 if (priceAttr) {
                     const parsedPrice = parseInt(priceAttr.replace(/,/g, ''), 10);
                     const parsedRate = rateAttr ? parseFloat(rateAttr) : 0;
                     const isIche = methodAttr === 'remittance' || methodAttr === 'transfer' || liText.includes('이체');
                     
                     if (parsedPrice > 10000) {
                         if (isIche) {
                             if (!foundRemittance || parsedPrice < bestPrice) {
                                 bestPrice = parsedPrice;
                                 bestRate = parsedRate;
                                 foundRemittance = true;
                             }
                         } else if (!foundRemittance && parsedPrice < bestPrice) {
                             bestPrice = parsedPrice;
                             bestRate = parsedRate;
                         }
                     }
                 }
             });
             
             if (bestPrice !== Infinity) {
                 if (bestRate === 0) {
                     bestRate = Math.round(((100000 - bestPrice) / 100000) * 100 * 100) / 100;
                 }
                 prices.push({
                     giftCardType: type,
                     denomination: 100000,
                     buyPrice: bestPrice,
                     buyRate: bestRate
                 });
             }
          }
        }
      }
    });

  } catch (error) {
    console.error(`Error scraping generic site ${siteName}:`, error);
  }

  return {
    siteName,
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
