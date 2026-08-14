import { CrawlResult, PriceInfo } from '../types';
import { fetchHtml } from './helper';

export async function crawlWooticket(): Promise<CrawlResult | null> {
  const url = 'http://www.wooticket.com/popup_price.php';
  const $ = await fetchHtml(url, 'euc-kr');
  if (!$) return null;

  const prices: PriceInfo[] = [];

  // 우천상품권은 테이블 내 td에 텍스트가 들어있음
  // 분석: tr을 순회하며 상품권 이름 확인
  $('tr').each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes('10만원') && !text.includes('제화')) {
      let type: PriceInfo['giftCardType'] | null = null;
      if (text.includes('신세계')) type = 'shinsegae';
      else if (text.includes('현대')) type = 'hyundai';
      else if (text.includes('롯데')) type = 'lotte';

      if (type) {
        const tds = $(el).find('td');
        let buyPrice = 0;
        let buyRate = 0;
        let sellPrice = 0;
        let sellRate = 0;

        tds.each((i, td) => {
          const tdText = $(td).text().trim();
          const normalized = tdText.replace(/,/g, '');
          const priceMatch = normalized.match(/(\d+)/);
          if (priceMatch && parseInt(priceMatch[1], 10) > 10000) {
            const currentPrice = parseInt(priceMatch[1], 10);
            const currentRateMatch = normalized.match(/\(([-\d.]+)\s*%\)/);
            const currentRate = currentRateMatch ? parseFloat(currentRateMatch[1]) : Math.round(((100000 - currentPrice) / 100000) * 10000) / 100;
            if (buyPrice === 0 || currentPrice < buyPrice) {
              buyPrice = currentPrice;
              buyRate = currentRate;
            }
            if (sellPrice === 0 || currentPrice > sellPrice) {
              sellPrice = currentPrice;
              sellRate = currentRate;
            }
          }
        });

        if (buyPrice > 0) {
          if (!prices.find(p => p.giftCardType === type)) {
             prices.push({
               giftCardType: type,
               denomination: 100000,
               buyPrice,
               buyRate,
               sellPrice: sellPrice > 0 ? sellPrice : undefined,
               sellRate: sellRate > 0 ? sellRate : undefined,
             });
          }
        }
      }
    }
  });

  return {
    siteName: '우천상품권',
    siteUrl: url,
    timestamp: new Date(),
    prices,
  };
}
