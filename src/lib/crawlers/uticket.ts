import { CrawlResult, PriceInfo } from '../types';
import axios from 'axios';

export async function crawlUticket(): Promise<CrawlResult | null> {
  const url = 'https://uticket.kr/';
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    const html = response.data;
    
    // JSON 데이터 추출 (Next.js 서버 사이드 렌더링된 스크립트 대응)
    const match = html.match(/\\?"giftCards\\?":(\[.*?\])/);
    if (!match) return null;

    let giftCards;
    try {
      // JSON 문자열의 이스케이프 문자 등을 처리
      const jsonStr = match[1].replace(/\\"/g, '"');
      giftCards = JSON.parse(jsonStr);
    } catch (e) {
       // parsing 오류시 좀 더 정교하게 처리
       const start = html.indexOf('"giftCards":') + 12;
       let bracketCount = 0;
       let end = start;
       for (let i = start; i < html.length; i++) {
           if (html[i] === '[') bracketCount++;
           else if (html[i] === ']') bracketCount--;
           
           if (bracketCount === 0 && html[i] === ']') {
               end = i + 1;
               break;
           }
       }
       const cleanJson = html.substring(start, end).replace(/\\"/g, '"').replace(/\\n/g, '').replace(/\\/g, '');
       try {
           giftCards = JSON.parse(cleanJson);
       } catch (err) {
           console.error("Uticket JSON parse error:", err);
           return null;
       }
    }

    const prices: PriceInfo[] = [];

    for (const card of giftCards) {
      if (card.faceValue === 100000 && card.type === 'PAPER') {
        let type: PriceInfo['giftCardType'] | null = null;
        if (card.name.includes('신세계')) type = 'shinsegae';
        else if (card.name.includes('현대')) type = 'hyundai';
        else if (card.name.includes('롯데')) type = 'lotte';

        if (type) {
          // buyPriceBank (계좌이체 매입가) 사용, 없으면 buyPrice
          const buyPrice = card.buyPriceBank > 0 ? card.buyPriceBank : card.buyPrice;
          if (buyPrice > 0) {
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

    return {
      siteName: '의리상품권',
      siteUrl: url,
      timestamp: new Date(),
      prices,
    };
  } catch (error) {
    console.error(`Error fetching uticket:`, error);
    return null;
  }
}
