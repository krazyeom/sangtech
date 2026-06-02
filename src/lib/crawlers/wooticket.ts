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
        // 보통 td 중 할인율(%)과 매입가(원)이 있음
        // 96,400원 3.6%
        const tds = $(el).find('td');
        let buyPrice = 0;
        let buyRate = 0;

        tds.each((i, td) => {
          const tdText = $(td).text().trim();
          if (tdText.includes('원') || (tdText.includes(',') && parseInt(tdText.replace(/,/g, '')) > 10000)) {
             const priceMatch = tdText.replace(/,/g, '').match(/(\d+)/);
             if (priceMatch && parseInt(priceMatch[1]) > 10000) {
                 const currentPrice = parseInt(priceMatch[1]);
                 if (buyPrice === 0 || currentPrice < buyPrice) {
                     buyPrice = currentPrice;
                 }
             }
          }
        });

        if (buyPrice > 0) {
          buyRate = ((100000 - buyPrice) / 100000) * 100;
          buyRate = Math.round(buyRate * 100) / 100; // 소수점 둘째자리까지

          // 중복 방지
          if (!prices.find(p => p.giftCardType === type)) {
             prices.push({
               giftCardType: type,
               denomination: 100000,
               buyPrice,
               buyRate,
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
