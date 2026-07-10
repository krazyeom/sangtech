import { CrawlResult } from '../types';
import { crawlGeneric } from './helper';
import { crawlChoigoTicket } from './choigoticket';
import { crawlWooticket } from './wooticket';
import { crawlUticket } from './uticket';
import { crawlGogoExchange } from './gogoexchange';
import { crawlHiticket } from './hiticket';
import { crawlKnct } from './knct';
import { crawlCitypay } from './citypay';
import { crawlVipticket } from './vipticket';

import { crawlDream } from './dream';
import { crawlWoorigift } from './woorigift';
import { crawlTicketstore } from './ticketstore';
import { crawlBestgift } from './bestgift';
import { crawlWooh } from './wooh';

export async function crawlAll(): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];

  const sites = [
    { name: '최고상품권', fn: crawlChoigoTicket },
    { name: '명인상품권', fn: () => crawlGeneric('http://mingren.co.kr/', '명인상품권') },
    { name: '마이페이', fn: () => crawlGeneric('http://my-pay.co.kr/', '마이페이') },
    { name: '엑스이상품권', fn: () => crawlGeneric('http://xegift.co.kr/', '엑스이상품권') },
    { name: '풍연상품권', fn: () => crawlGeneric('http://www.py-ticket.com/', '풍연상품권') },
    { name: '하이티켓', fn: crawlHiticket },
    { name: '우천상품권', fn: crawlWooticket },
    { name: '의리상품권', fn: crawlUticket },
    { name: '기프너스(잠실)', fn: () => crawlGeneric('https://www.gifnus.co.kr', '기프너스(잠실)', { bypassTenKCheck: true }) },
    { name: '미래상품권', fn: () => crawlGeneric('https://meee.co.kr/', '미래상품권', { bypassTenKCheck: true }) },
    { name: '중앙상품권', fn: () => crawlGeneric('https://centralgift.imweb.me/', '중앙상품권') },
    { name: '회현상품권', fn: () => crawlGeneric('https://www.hhvip.co.kr/', '회현상품권') },
    { name: '고고상품권', fn: crawlGogoExchange },
    { name: '명동상품권', fn: () => crawlGeneric('https://ticketno1.co.kr/popup/popup_6.html?idx=6&type=W&__popupPage=T', '명동상품권') },
    { name: '도전상품권(삼성)', fn: crawlKnct },
    { name: '씨티상품권', fn: crawlCitypay },
    { name: 'VIP상품권(잠실)', fn: crawlVipticket },
    { name: '드림상품권', fn: crawlDream },
    { name: '행복상품권', fn: crawlWoorigift },
    { name: '맥스솔루션(안양)', fn: crawlTicketstore },
    { name: '우현상품권', fn: crawlWooh },
    { name: '베스트상품권', fn: crawlBestgift },
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
