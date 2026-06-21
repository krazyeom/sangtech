import { crawlGeneric } from './src/lib/crawlers/helper';

async function run() {
  console.log("--- 고고 상품권 파싱 ---");
  const result = await crawlGeneric('https://www.gogoexchange.co.kr', '고고상품권', { bypassTenKCheck: true });
  console.log(result.prices);
}

run();
