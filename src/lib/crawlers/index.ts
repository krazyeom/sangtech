import { CrawlResult } from '../types';
import { crawlGeneric } from './helper';
import { crawlChoigoTicket } from './choigoticket';
import { crawlWooticket } from './wooticket';
import { crawlUticket } from './uticket';
import { crawlGogoExchange } from './gogoexchange';

export async function crawlAll(): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  
  const sites = [
    { name: '최고상품권', fn: crawlChoigoTicket },
    { name: '명인상품권', fn: () => crawlGeneric('http://mingren.co.kr/', '명인상품권') },
    { name: '마이페이', fn: () => crawlGeneric('http://my-pay.co.kr/', '마이페이') },
    { name: '엑스이상품권', fn: () => crawlGeneric('http://xegift.co.kr/', '엑스이상품권') },
    { name: '풍연상품권', fn: () => crawlGeneric('http://www.py-ticket.com/', '풍연상품권') },
    { name: '하이티켓', fn: () => crawlGeneric('http://hiticket99.com/', '하이티켓') },
    { name: '우천상품권', fn: crawlWooticket },
    { name: '의리상품권', fn: crawlUticket },
    { name: '기프터스', fn: () => crawlGeneric('https://www.gifnus.co.kr/', '기프터스', { bypassTenKCheck: true }) },
    { name: '미래상품권', fn: () => crawlGeneric('https://meee.co.kr/', '미래상품권', { bypassTenKCheck: true }) },
    { name: '중앙상품권', fn: () => crawlGeneric('https://centralgift.imweb.me/', '중앙상품권') },
    { name: '회현상품권', fn: () => crawlGeneric('https://www.hhvip.co.kr/', '회현상품권') },
    { name: '고고상품권', fn: crawlGogoExchange },
  ];

  for (const site of sites) {
    try {
      console.log(`Crawling ${site.name}...`);
      const res = await site.fn();
      if (res && res.prices.length > 0) {
        results.push(res);
      } else {
        console.warn(`[Warning] No prices parsed for ${site.name}`);
      }
    } catch (e) {
      console.error(`Error crawling ${site.name}:`, e);
    }
  }

  return results;
}
